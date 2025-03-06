"use client"

import { supabase } from './supabase'

/**
 * Checks if the required tables exist in the database and creates them if they don't
 */
export async function checkAndCreateTables() {
  console.log("Checking required database tables...");
  
  try {
    // Check if user_pats table exists
    const { error: patTableError, count: patTableCount } = await supabase
      .from('user_pats')
      .select('*', { count: 'exact', head: true });
    
    // Check if compliance_logs table exists
    const { error: logsTableError, count: logsTableCount } = await supabase
      .from('compliance_logs')
      .select('*', { count: 'exact', head: true });
    
    const tablesMissing = 
      (patTableError && patTableError.code === '42P01') || // Table doesn't exist
      (logsTableError && logsTableError.code === '42P01');
    
    if (tablesMissing) {
      console.log("Required tables missing. Attempting to create tables...");
      
      // Only show the tables missing error dialog once
      const hasShownError = localStorage.getItem('db_tables_error_shown');
      if (!hasShownError) {
        alert(`
DATABASE TABLES MISSING

The required database tables don't exist in your Supabase project. 

Please execute the SQL in lib/supabase-setup.sql in your Supabase SQL Editor.

Until the tables are created, some features might not work properly.
        `);
        localStorage.setItem('db_tables_error_shown', 'true');
      }
      
      return false;
    }
    
    console.log("Database tables exist:", {
      user_pats: !patTableError,
      compliance_logs: !logsTableError
    });
    
    return true;
  } catch (error) {
    console.error("Error checking database tables:", error);
    return false;
  }
} 