import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Supabase Management API base URL
const MANAGEMENT_API_URL = "https://api.supabase.com/v1"

export async function GET(request: Request) {
  try {
    // Get API key and project ID from query parameters
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('apiKey')
    const projectId = url.searchParams.get('projectId') || url.searchParams.get('projectRef')
    
    if (!apiKey || !projectId) {
      return NextResponse.json(
        { error: "API key and project ID are required" },
        { status: 400 }
      )
    }
    
    // Get service_role key from Supabase Management API
    const response = await fetch(`${MANAGEMENT_API_URL}/projects/${projectId}/api-keys`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch API keys: ${response.status}`)
    }
    
    const apiKeys = await response.json()
    const serviceRoleKey = apiKeys.find((key: any) => key.name === 'service_role')?.api_key
    
    if (!serviceRoleKey) {
      throw new Error("Service role key not found")
    }
    
    // Create Supabase client with service_role key
    const supabaseUrl = `https://${projectId}.supabase.co`
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    // Fetch all users to check their MFA status
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      throw new Error(error.message)
    }
    
    // Count users with MFA enabled
    const totalCount = users.users.length
    let enabledCount = 0
    
    const userDetails = users.users.map((user: any) => {
      const mfaEnabled = user.factors && user.factors.length > 0
      if (mfaEnabled) enabledCount++
      
      return {
        id: user.id,
        email: user.email,
        mfa_enabled: mfaEnabled,
        last_sign_in: user.last_sign_in_at
      }
    })
    
    // Determine if the check passed (all users have MFA enabled)
    const passed = totalCount > 0 && enabledCount === totalCount
    const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0
    
    return NextResponse.json({
      passed,
      totalCount,
      enabledCount,
      percentage,
      details: userDetails
    })
    
  } catch (error) {
    console.error("Error checking MFA:", error)
    return NextResponse.json({
      passed: false,
      totalCount: 0,
      enabledCount: 0,
      percentage: 0,
      details: [],
      hasError: true,
      error: error instanceof Error ? error.message : "Failed to check MFA status"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey, projectId, projectRef } = body;
    
    // Use either projectId or projectRef
    const projectReference = projectId || projectRef;
    
    if (!apiKey || !projectReference) {
      return NextResponse.json(
        { error: "API key and project ID are required" },
        { status: 400 }
      )
    }
    
    // Get service_role key from Supabase Management API
    const response = await fetch(`${MANAGEMENT_API_URL}/projects/${projectReference}/api-keys`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch API keys: ${response.status}`)
    }
    
    const apiKeys = await response.json()
    const serviceRoleKey = apiKeys.find((key: any) => key.name === 'service_role')?.api_key
    
    if (!serviceRoleKey) {
      throw new Error("Service role key not found")
    }
    
    // Create Supabase client with service_role key
    const supabaseUrl = `https://${projectReference}.supabase.co`
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    // Fetch all users to check their MFA status
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      throw new Error(error.message)
    }
    
    // Count users with MFA enabled
    const totalCount = users.users.length
    let enabledCount = 0
    
    const userDetails = await Promise.all(users.users.map(async (user: any) => {
      // Check MFA status using the auth/factors REST endpoint
      const factorsResponse = await fetch(`${supabaseUrl}/rest/v1/auth/factors?user_id=${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey
        }
      })
      
      let mfaEnabled = false
      let factorsData: any[] = []
      
      if (factorsResponse.ok) {
        factorsData = await factorsResponse.json()
        // Only count verified factors
        mfaEnabled = factorsData.some(factor => factor.status === 'verified')
        if (mfaEnabled) enabledCount++
      }
      
      return {
        id: user.id,
        email: user.email,
        mfa_enabled: mfaEnabled,
        factors: factorsData,
        last_sign_in: user.last_sign_in_at
      }
    }))
    
    // Determine if the check passed (all users have MFA enabled)
    const passed = totalCount > 0 && enabledCount === totalCount
    const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0
    
    return NextResponse.json({
      passed,
      totalCount,
      enabledCount,
      percentage,
      details: userDetails
    })
    
  } catch (error) {
    console.error("Error checking MFA:", error)
    return NextResponse.json({
      passed: false,
      totalCount: 0,
      enabledCount: 0,
      percentage: 0,
      details: [],
      hasError: true,
      error: error instanceof Error ? error.message : "Failed to check MFA status"
    }, { status: 500 })
  }
}

