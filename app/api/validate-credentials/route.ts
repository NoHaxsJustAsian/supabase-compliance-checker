import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { apiKey, projectRef, checkAllProjects } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // When checking a single project, project reference is required
    if (!checkAllProjects && !projectRef) {
      return NextResponse.json({ error: "Project reference is required when checking a single project" }, { status: 400 })
    }

    // Real implementation to validate credentials with Supabase API
    const validation = await validateSupabaseCredentials(apiKey, projectRef, checkAllProjects)
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error || "Invalid credentials",
        message: validation.message 
      }, { status: validation.statusCode || 401 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Credentials validated successfully",
      details: validation.details || {}
    })
  } catch (error) {
    console.error("Error validating credentials:", error)
    return NextResponse.json({ 
      error: "Failed to validate credentials",
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  message?: string;
  details?: any;
  statusCode?: number;
}

async function validateSupabaseCredentials(
  apiKey: string, 
  projectRef: string | null, 
  checkAllProjects = false
): Promise<ValidationResult> {
  try {
    // Check if it's a Personal Access Token (starts with sbp_)
    const isPAT = apiKey.startsWith('sbp_');
    
    if (isPAT) {
      // For PATs, we use the Management API to validate
      return await validateWithManagementAPI(apiKey, projectRef, checkAllProjects);
    } else {
      // For service role keys or other project keys, validate directly with the project
      // Can't check all projects with a non-PAT key
      if (checkAllProjects) {
        return {
          isValid: false,
          error: "Invalid key type for checking all projects",
          message: "To check all projects, you must use a Personal Access Token (PAT). Service role keys can only be used for single project checks."
        }
      }
      
      if (!projectRef) {
        return {
          isValid: false,
          error: "Project reference required",
          message: "A project reference is required when using a service role key or other project-specific key."
        }
      }
      
      return await validateWithProjectAPI(apiKey, projectRef);
    }
  } catch (error) {
    console.error("Error validating with Supabase API:", error)
    return {
      isValid: false,
      error: "Connection error",
      message: error instanceof Error ? error.message : "Failed to connect to Supabase"
    }
  }
}

// Validate using the Management API (for Personal Access Tokens)
async function validateWithManagementAPI(
  apiKey: string,
  projectRef: string | null,
  checkAllProjects: boolean
): Promise<ValidationResult> {
  const managementResponse = await fetch('https://api.supabase.com/v1/projects', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  // Handle rate limiting (60 requests per minute per user)
  if (managementResponse.status === 429) {
    return {
      isValid: false,
      error: "Rate limit exceeded",
      message: "You've exceeded the rate limit of 60 requests per minute. Please try again later.",
      statusCode: 429
    }
  }

  // Handle Management API validation
  if (managementResponse.ok) {
    const projects = await managementResponse.json()
    
    // When checking all projects, just verify we have Management API access
    if (checkAllProjects) {
      return {
        isValid: true,
        message: "Management API access validated successfully for all projects",
        details: {
          keyType: "personal_access_token",
          projectCount: projects.length,
          projects: projects.map((project: any) => ({
            name: project.name,
            ref: project.ref,
            organization: project.organization?.name || 'Unknown'
          }))
        }
      }
    }
    
    // When checking a specific project, verify it exists
    if (projectRef) {
      const projectExists = projects.some((project: any) => project.ref === projectRef)
      
      if (!projectExists) {
        return {
          isValid: false,
          error: "Project reference is invalid",
          message: "The provided project reference was not found in your account"
        }
      }
      
      // Find project details
      const targetProject = projects.find((project: any) => project.ref === projectRef)
      
      return {
        isValid: true,
        message: "Management API access validated successfully for specified project",
        details: {
          keyType: "personal_access_token",
          project: {
            name: targetProject?.name || 'Unknown',
            ref: targetProject?.ref,
            organization: targetProject?.organization?.name || 'Unknown'
          }
        }
      }
    }
  }
  
  // Management API authentication failed
  if (managementResponse.status === 401) {
    return {
      isValid: false,
      error: "Invalid Personal Access Token",
      message: "The token provided is not a valid Personal Access Token. Generate one from your Supabase account page.",
      statusCode: 401
    }
  }
  
  return {
    isValid: false,
    error: "Validation failed",
    message: `Authentication failed. Please ensure you're using a valid Personal Access Token (PAT).`,
    statusCode: managementResponse.status
  }
}

// Validate using direct project API (for service role keys and other project keys)
async function validateWithProjectAPI(apiKey: string, projectRef: string): Promise<ValidationResult> {
  // Try accessing the project directly with the provided key
  const supabaseUrl = `https://${projectRef}.supabase.co/rest/v1/`
  
  // First, try to get the project information
  const response = await fetch(`${supabaseUrl}?apikey=${apiKey}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'apikey': apiKey,
    },
  })

  if (response.status === 200) {
    // Try to determine if this is a service role key by attempting to access a protected endpoint
    const adminCheck = await fetch(`${supabaseUrl}auth/v1/admin/users?page=1&per_page=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'apikey': apiKey,
      },
    });
    
    const isServiceRole = adminCheck.status === 200;
    
    return {
      isValid: true,
      message: isServiceRole 
        ? "Service role key validated successfully"
        : "Project API key validated successfully, but some management features may be limited",
      details: {
        keyType: isServiceRole ? "service_role" : "project_api_key",
        projectRef,
        hasFullAccess: isServiceRole
      }
    }
  }
  
  // Handle common error cases
  if (response.status === 404) {
    return {
      isValid: false,
      error: "Project not found",
      message: "The project reference provided does not exist or is incorrect"
    }
  }
  
  if (response.status === 401 || response.status === 403) {
    return {
      isValid: false,
      error: "Invalid API key",
      message: "The API key provided is not valid for this project"
    }
  }
  
  return {
    isValid: false,
    error: "Validation failed",
    message: `API access failed with status: ${response.status}. Please check your credentials.`
  }
}

