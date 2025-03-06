import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Supabase Management API base URL
const MANAGEMENT_API_URL = "https://api.supabase.com/v1"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey } = body
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      )
    }
    
    // Fetch projects from Supabase Management API
    const response = await fetch(`${MANAGEMENT_API_URL}/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch projects: ${response.status}`)
    }
    
    const projects = await response.json()
    
    // Map projects to match the Supabase API schema while ensuring all needed fields are present
    const mappedProjects = projects.map((project: any) => ({
      id: project.id,
      organization_id: project.organization_id,
      name: project.name,
      region: project.region,
      created_at: project.created_at,
      status: project.status,
      ref: project.ref,
      database: project.database || {
        host: project.db_host,
        version: project.db_version,
        postgres_engine: project.postgres_engine,
        release_channel: project.release_channel
      }
    }))
    
    return NextResponse.json({
      projects: mappedProjects
    })
    
  } catch (error) {
    console.error("Error listing projects:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list projects" },
      { status: 500 }
    )
  }
} 