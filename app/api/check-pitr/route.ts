import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCredentials, getCredentialsFromRequest, getCredentialsFromQuery } from "@/lib/auth-utils"


interface ProjectWithPitr {
  id: string;
  name: string;
  region: string;
  pitr_enabled: boolean;
  backups?: {
    count: number;
    earliest?: number; // Unix timestamp
    latest?: number;   // Unix timestamp
  };
  error?: string;      // To store any error message
}

export async function GET(request: Request) {
  try {
    // First try to get credentials from Authorization header, then fallback to query params
    // Check for Authorization Bearer token in the header
    const authHeader = request.headers.get('Authorization')
    let apiKey, projectId;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7) // Remove "Bearer " prefix
      const url = new URL(request.url)
      // Check for both parameter names (projectRef and ProjectID)
      projectId = url.searchParams.get('projectRef') || url.searchParams.get('ProjectID')
    } else {
      // Fallback to query parameters
      const url = new URL(request.url)
      apiKey = url.searchParams.get('apiKey')
      // Check for both parameter names (projectRef and ProjectID)
      projectId = url.searchParams.get('projectRef') || url.searchParams.get('ProjectID')
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    return await checkPitrForSingleProject(apiKey, projectId)
  } catch (error) {
    console.error("Error checking PITR status:", error)
    return NextResponse.json(
      { error: "Failed to check PITR status. Please check your credentials and try again." },
      { status: 500 }
    )
  }
}

// Function to check PITR for a single project
async function checkPitrForSingleProject(apiKey: string, projectId: string) {
  try {
    // Call the backups endpoint directly for this project
    const backupResponse = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/database/backups`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Get project details 
    const projectResponse = await fetch(`https://api.supabase.com/v1/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    // Initialize the project with what we know
    const project: ProjectWithPitr = {
      id: projectId,
      name: "Unknown", // Default value in case we can't get project details
      region: "Unknown",
      pitr_enabled: false
    }

    // Process project data if available
    if (projectResponse.ok) {
      const projectData = await projectResponse.json()
      project.name = projectData.name
      project.region = projectData.region
    } else {
      project.error = `Failed to fetch project details: ${projectResponse.statusText}`
      console.error(`Failed to fetch project details for ${projectId}:`, projectResponse.statusText)
    }

    // Process backup data if available
    if (backupResponse.ok) {
      const backupData = await backupResponse.json()
      project.pitr_enabled = !!backupData.pitr_enabled
      
      // Add backup information
      project.backups = {
        count: backupData.backups?.length || 0
      }
      
      // Add earliest and latest backup dates if they exist
      if (backupData.physical_backup_data) {
        project.backups.earliest = backupData.physical_backup_data.earliest_physical_backup_date_unix || null
        project.backups.latest = backupData.physical_backup_data.latest_physical_backup_date_unix || null
      }
    } else {
      const errorData = await backupResponse.json().catch(() => ({}))
      project.error = `Failed to fetch backup info: ${backupResponse.statusText}`
      console.error(`Failed to fetch backup info for project ${projectId}:`, backupResponse.statusText, errorData)
    }

    console.log(`PITR Check - Single project: ${project.name}, PITR enabled: ${project.pitr_enabled}`)

    return NextResponse.json({
      passed: project.pitr_enabled,
      enabledCount: project.pitr_enabled ? 1 : 0,
      totalCount: 1,
      projects: [project],
      // If there's an error, include it in the response but don't fail the request
      hasError: !!project.error
    })
  } catch (error) {
    console.error(`Error checking PITR for project ${projectId}:`, error)
    
    // Instead of returning a failed response, return a properly structured response with error info
    const project: ProjectWithPitr = {
      id: projectId,
      name: "Unknown",
      region: "Unknown",
      pitr_enabled: false,
      error: `Error checking PITR for project ${projectId}: ${error instanceof Error ? error.message : "Unknown error"}`
    }
    
    return NextResponse.json({
      passed: false,
      enabledCount: 0,
      totalCount: 1,
      projects: [project],
      hasError: true
    })
  }
}

