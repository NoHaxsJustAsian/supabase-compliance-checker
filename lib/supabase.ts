"use client"

import { createClient } from '@supabase/supabase-js'

// Check for environment variables and provide useful error messages
let supabaseUrl: string;
let supabaseAnonKey: string;

try {
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl) {
    console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. Make sure you have created a .env.local file with the necessary variables.');
    if (typeof window !== 'undefined') {
      // Only show in browser, not during server-side rendering
      alert('Supabase URL is missing. Please check your .env.local file and ensure it contains NEXT_PUBLIC_SUPABASE_URL.');
    }
  }

  if (!supabaseAnonKey) {
    console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Make sure you have created a .env.local file with the necessary variables.');
    if (typeof window !== 'undefined') {
      // Only show in browser, not during server-side rendering
      alert('Supabase Anon Key is missing. Please check your .env.local file and ensure it contains NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
  }
} catch (error) {
  console.error('Error initializing Supabase environment variables:', error);
  throw error;
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Log client initialization
console.log('Supabase client initialized with URL:', supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : 'missing');

// Add a helper function to check connection
export const checkSupabaseConnection = async () => {
  try {
    // Try to get the current session as a basic connectivity test
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection test succeeded');
    return { success: true, data };
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return { success: false, error };
  }
} 