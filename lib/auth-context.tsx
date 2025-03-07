"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'
import { storePATSafely } from './auth-utils'

// Define what the auth context will store
type AuthContextType = {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
  storePAT: (pat: string, projectId: string | null, checkAllProjects: boolean) => Promise<boolean>
  getPAT: () => Promise<{ pat: string | null, projectId: string | null, checkAllProjects: boolean } | null>
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signUp: async () => ({ error: new Error('Not implemented') }),
  signIn: async () => ({ error: new Error('Not implemented') }),
  signOut: async () => ({ error: new Error('Not implemented') }),
  loading: true,
  storePAT: async () => false,
  getPAT: async () => null
})

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)

// Provider component that wraps your app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Listen for changes on auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Initialize the session and user
    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }
    
    initializeAuth()

    return () => subscription.unsubscribe()
  }, [])

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      console.log("Signing up with email:", email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      console.log("Sign up response:", { data, error })
      return { data, error }
    } catch (error) {
      console.error("Error during sign up:", error)
      return { error }
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in with email:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log("Sign in response:", { data, error })
      return { data, error }
    } catch (error) {
      console.error("Error during sign in:", error)
      return { error }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      // Clear credentials from session storage safely
      try {
        const { clearCredentials, getCredentials } = await import('./auth-utils')
        
        // Check if credentials exist first (optional, just for logging)
        const credentials = await getCredentials()
        console.log("Found credentials during signout:", !!credentials)
        
        // Always clear credentials, even if there are none
        clearCredentials()
      } catch (e) {
        console.error("Error handling credentials during sign out:", e)
        // Continue with sign out even if clearing credentials fails
      }
      
      // Sign out from Supabase Auth
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.warn("Supabase sign out error:", error)
        }
      } catch (authError) {
        console.error("Error during Supabase auth signOut:", authError)
      }
      
      // Always navigate to auth page, regardless of any errors
      router.push('/auth')
      
      return { error: null }
    } catch (error) {
      console.error("Unexpected error during sign out:", error)
      // Still try to navigate to auth page
      router.push('/auth')
      return { error }
    }
  }

  // Store PAT in user metadata
  const storePAT = async (pat: string, projectId: string | null, checkAllProjects: boolean) => {
    try {
      if (!user) return false

      // Store the PAT using the safer function that handles missing tables
      return await storePATSafely(user.id, pat, projectId, checkAllProjects)
    } catch (error) {
      console.error('Error storing PAT:', error)
      return false
    }
  }

  // Get the user's PAT
  const getPAT = async () => {
    try {
      if (!user) return null

      // Get the PAT from the user_pats table
      const { data, error } = await supabase
        .from('user_pats')
        .select('pat, project_id, check_all_projects')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If the error is because the table doesn't exist, log it but don't throw
        if (error.code === '42P01') {
          console.warn('user_pats table does not exist');
          return null;
        }
        
        console.error('Error retrieving PAT:', error)
        return null
      }

      if (!data) return null

      return {
        pat: data.pat,
        projectId: data.project_id,
        checkAllProjects: data.check_all_projects
      }
    } catch (error) {
      console.error('Error retrieving PAT:', error)
      return null
    }
  }

  // Value object that will be passed to the children components
  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    storePAT,
    getPAT
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 