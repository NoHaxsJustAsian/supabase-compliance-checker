"use client"
import { supabase } from './supabase'
const isBrowser = typeof window !== 'undefined'

export function storeCredentials(pat: string, projectId: string | null, checkAllProjects = false) {
  if (isBrowser) {
    try {
      const timestamp = Date.now().toString();
      const random = Math.random().toString();
      const obfuscatedKey = btoa(`${timestamp}|||${pat}|||${random}`)
      
      sessionStorage.setItem("supabase_pat", obfuscatedKey)
      
      // Store project ID if checking a single project
      if (projectId) {
        sessionStorage.setItem("supabase_project_id", projectId)
      } else {
        sessionStorage.removeItem("supabase_project_id")
      }

      sessionStorage.setItem("supabase_check_all_projects", checkAllProjects ? "true" : "false")
      sessionStorage.setItem("supabase_last_auth", Date.now().toString())
      
      return true
    } catch (error) {
      console.error("Failed to store credentials:", error)
      return false
    }
  }
  
  return false
}

// Get credentials from session storage (temporary fallback) or from Supabase Auth if available
export async function getCredentials() {
  const { data } = await supabase.auth.getSession()
  
  if (data.session?.user) {
    try {
      // Get PAT from user_pats table
      const { data: patData, error } = await supabase
        .from('user_pats')
        .select('pat, project_id, check_all_projects')
        .eq('user_id', data.session.user.id)
        .single()
        
      if (!error && patData) {
        return {
          apiKey: patData.pat,
          projectId: patData.project_id || null,
          checkAllProjects: patData.check_all_projects
        }
      }
    } catch (error) {
      console.error("Error retrieving credentials from Supabase:", error)
    }
  }
  
  if (isBrowser) {
    try {
      const obfuscatedKey = sessionStorage.getItem("supabase_pat")
      const projectId = sessionStorage.getItem("supabase_project_id")
      const checkAllProjects = sessionStorage.getItem("supabase_check_all_projects") === "true"

      if (!obfuscatedKey) {
        return null
      }

      // Decode the obfuscated key and extract the original PAT
      const decoded = atob(obfuscatedKey)
      const parts = decoded.split('|||')
      const pat = parts[1]

      if (!pat) {
        clearCredentials()
        return null
      }

      return { 
        apiKey: pat, // Keep apiKey name for backward compatibility
        projectId: projectId || null,
        checkAllProjects 
      }
    } catch (error) {
      console.error("Error retrieving credentials from session storage:", error)
      clearCredentials()
      return null
    }
  }
  
  // Server-side: credentials should be passed in the request or from environment variables
  return null
}

// Log compliance check to the database if user is logged in
export async function logComplianceCheck(
  checkType: string,
  status: 'PASSED' | 'FAILED' | 'ERROR',
  details: string,
  projectId?: string,
  projectName?: string
) {
  // Check if user is logged in
  const { data } = await supabase.auth.getSession()
  
  if (!data.session?.user) {
    // User is not logged in, just return
    return false
  }
  
  try {
    const { error } = await supabase
      .from('compliance_logs')
      .insert({
        user_id: data.session.user.id,
        check_type: checkType,
        status,
        details,
        project_id: projectId,
        project_name: projectName,
      })
      
    // If the table doesn't exist, just log to console instead
    if (error && error.code === '42P01') {
      console.warn('compliance_logs table does not exist. Logging to console instead:', {
        check_type: checkType,
        status,
        details,
        project_id: projectId,
        project_name: projectName,
      });
      
      return false;
    }
      
    return !error
  } catch (error) {
    console.error("Error logging compliance check:", error)
    return false
  }
}

export function clearCredentials() {
  if (isBrowser) {
    // Clear all session storage items related to authentication
    sessionStorage.removeItem("supabase_pat")
    sessionStorage.removeItem("supabase_project_id")
    sessionStorage.removeItem("supabase_last_auth")
    sessionStorage.removeItem("supabase_rate_limit_remaining")
    sessionStorage.removeItem("supabase_check_all_projects")
    
    // Clear any other potential auth-related items
    localStorage.removeItem('supabase.auth.token')
    
    // Also clear any supabase cookies that might be present
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=')
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      }
    })
  }
}

// Track API rate limits (60 requests per minute per user)
export function trackRateLimit(remaining?: number) {
  if (isBrowser) {
    // If a remaining count is provided, store it
    if (remaining !== undefined) {
      sessionStorage.setItem("supabase_rate_limit_remaining", remaining.toString())
      return
    }
    
    // Otherwise, decrement the current count
    const current = parseInt(sessionStorage.getItem("supabase_rate_limit_remaining") || "60", 10)
    const newValue = Math.max(0, current - 1)
    sessionStorage.setItem("supabase_rate_limit_remaining", newValue.toString())
    
    return newValue
  }
  
  return 60 // Default value for server-side
}

// Reset rate limit if a minute has passed since last reset
export function checkAndResetRateLimit() {
  if (isBrowser) {
    const lastAuth = parseInt(sessionStorage.getItem("supabase_last_auth") || "0", 10)
    const now = Date.now()
    
    // If more than a minute has passed, reset the rate limit counter
    if (now - lastAuth > 60 * 1000) {
      sessionStorage.setItem("supabase_rate_limit_remaining", "60")
      sessionStorage.setItem("supabase_last_auth", now.toString())
      return 60
    }
    
    return parseInt(sessionStorage.getItem("supabase_rate_limit_remaining") || "60", 10)
  }
  
  return 60 // Default value for server-side
}

// Get credentials from query parameters for GET requests
export function getCredentialsFromQuery(request: Request) {
  try {
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('apiKey')
    const projectId = url.searchParams.get('projectRef')
    const checkAllProjects = url.searchParams.get('checkAllProjects') === 'true' || !projectId
    
    if (!apiKey) {
      return null
    }
    
    return { 
      apiKey, 
      projectId,
      checkAllProjects
    }
  } catch (error) {
    console.error("Error extracting credentials from query:", error)
    return null
  }
}

// For server-side API routes, get credentials from the request body
export async function getCredentialsFromRequest(request: Request) {
  try {
    // First check for Authorization header with Bearer token
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.substring(7) // Remove "Bearer " prefix
      
      // Check for projectRef in query parameters or use null for all projects
      const url = new URL(request.url)
      const projectId = url.searchParams.get('projectRef')
      const checkAllProjects = !projectId
      
      if (apiKey) {
        return {
          apiKey,
          projectId,
          checkAllProjects
        }
      }
    }
    
    // If not found in header, try to get from request body
    const body = await request.json()
    const { apiKey, projectId, checkAllProjects } = body
    
    if (!apiKey) {
      return null
    }
    
    // If checkAllProjects is true, projectId is optional
    if (!projectId && !checkAllProjects) {
      return null
    }
    
    return { 
      apiKey, 
      projectId: projectId || null,
      checkAllProjects: checkAllProjects || false 
    }
  } catch (error) {
    console.error("Error extracting credentials from request:", error)
    return null
  }
}

// Also update storePAT function to handle missing tables
export async function storePATSafely(user_id: string, pat: string, projectId: string | null, checkAllProjects: boolean) {
  try {
    const { error } = await supabase
      .from('user_pats')
      .upsert(
        { 
          user_id,
          pat, 
          project_id: projectId,
          check_all_projects: checkAllProjects,
          updated_at: new Date().toISOString()
        }, 
        { onConflict: 'user_id' }
      )
    
    // If the table doesn't exist, use session storage as fallback
    if (error && error.code === '42P01') {
      console.warn('user_pats table does not exist. Using session storage instead.');
      storeCredentials(pat, projectId, checkAllProjects);
      return true;
    }
    
    return !error
  } catch (error) {
    console.error('Error storing PAT:', error)
    // Use session storage as fallback
    storeCredentials(pat, projectId, checkAllProjects);
    return false
  }
}

