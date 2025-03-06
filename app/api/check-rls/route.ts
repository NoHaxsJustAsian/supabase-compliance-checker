import { NextResponse } from "next/server"

// Supabase Management API base URL
const MANAGEMENT_API_URL = "https://api.supabase.com/v1"

export async function GET(request: Request) {
  try {
    // Get API key and project ID from query parameters
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('apiKey')
    const projectId = url.searchParams.get('projectId') || url.searchParams.get('projectRef')
    
    // Validate required parameters
    const credentials = apiKey && projectId
      ? { apiKey, projectId }
      : null
      
    if (!credentials) {
      return NextResponse.json(
        { error: "API key and project ID are required" },
        { status: 400 }
      )
    }
    
    // Use the direct database query endpoint
    const response = await fetch(`${MANAGEMENT_API_URL}/projects/${credentials.projectId}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${credentials.apiKey}`
      },
      body: JSON.stringify({
        query: `
          SELECT 
            n.nspname as schema_name,
            c.relname as table_name,
            c.relrowsecurity
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE c.relkind = 'r'
          AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        `
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to query database: ${response.status}`)
    }
    
    const result = await response.json()
    
    // Log the complete raw result to the server console
    console.log('Raw API response:')
    console.log(JSON.stringify(result, null, 2))
    
    // Check if result is an array directly or contains a result property
    const data = Array.isArray(result) ? result : (result.result || [])
    
    console.log('Processed table data:')
    console.log(data)
    
    // Define the type for tables
    type TableRecord = {
      schema_name: string;
      table_name: string;
      relrowsecurity: boolean;
    };
    
    // Process the results
    const tableStatuses = (data as TableRecord[]).map((table) => {
      return {
        id: `${table.schema_name}.${table.table_name}`,
        name: table.table_name,
        schema: table.schema_name,
        rls_enabled: table.relrowsecurity
      }
    })
    
    // Calculate RLS stats
    const totalCount = tableStatuses.length
    const enabledCount = tableStatuses.filter(table => table.rls_enabled).length
    const passed = totalCount > 0 && enabledCount === totalCount
    const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0
    
    return NextResponse.json({
      rawResult: result,
      rawTables: data,
      passed,
      totalCount,
      enabledCount,
      percentage,
      details: tableStatuses
    })
    
  } catch (error) {
    console.error("Error checking RLS:", error)
    return NextResponse.json({
      passed: false,
      totalCount: 0,
      enabledCount: 0,
      percentage: 0,
      details: [],
      hasError: true,
      error: error instanceof Error ? error.message : "Failed to check RLS status"
    }, { status: 500 })
  }
}

