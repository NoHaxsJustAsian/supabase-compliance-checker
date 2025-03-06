"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ShieldAlert, ArrowRight, LogOut, Building, Server, Shield, Clock, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"

export default function Home() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Allow the auth state to be loaded
    setLoading(false)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <ShieldAlert className="h-6 w-6" />
              <span className="font-bold">Supabase Compliance Checker</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-4">
              {!loading && user ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium">
                    Dashboard
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={async () => await signOut()}
                    className="text-sm font-medium"
                  >
                    Logout <LogOut className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/auth" className="text-sm font-medium">
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40">
          <div className="container px-4 md:px-6">
            {/* Hero content with centered layout */}
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none mb-6">
                Ensure Your Supabase Configuration is Compliant
              </h1>
              <p className="text-muted-foreground md:text-xl mb-8">
                Automatically check your Supabase setup for security best practices and compliance requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth">
                  <Button size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Finta-inspired macOS window with placeholder image - moved above the cards */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
                {/* Window title bar */}
                <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4">
                  <div className="flex space-x-2 ml-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="absolute left-0 right-0 mx-auto text-center text-xs text-gray-500 font-medium" style={{ width: 'fit-content' }}>Supabase Compliance Dashboard</div>
                </div>
                
                {/* Placeholder image instead of scrollable content */}
                <div className="h-[400px] bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
                  <div className="text-center p-8 max-w-xl">
                    <div className="text-2xl font-bold text-gray-800 mb-2">Security Compliance Monitor</div>
                    <p className="text-gray-600 mb-6">Real-time monitoring, automated checks, comprehensive reporting.</p>
                    <div className="flex gap-4 justify-center items-center">
                      <div className="h-32 w-32 bg-white rounded-lg shadow-md flex items-center justify-center transition-transform hover:scale-105 duration-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">94%</div>
                          <div className="text-xs text-gray-500">Overall Score</div>
                        </div>
                      </div>
                      <div className="h-32 w-32 bg-white rounded-lg shadow-md flex items-center justify-center transition-transform hover:scale-105 duration-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-500">3</div>
                          <div className="text-xs text-gray-500">Warnings</div>
                        </div>
                      </div>
                      <div className="h-32 w-32 bg-white rounded-lg shadow-md flex items-center justify-center transition-transform hover:scale-105 duration-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">12/15</div>
                          <div className="text-xs text-gray-500">Checks Passed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features section styled as a two-column layout with animated components */}
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8 relative">
                <div className="flex items-center text-blue-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <h2 className="text-xl font-bold">AUTO-VERIFICATION</h2>
                </div>
                <p className="text-gray-600">Compliance checks are automatically run and verified in real-time.</p>
              </div>
              
              {/* MFA Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-bold mb-2">Multi-Factor Authentication</h3>
                  <p className="text-gray-600 mb-4">
                    Verify that MFA is properly configured for all users in your Supabase project. This critical security
                    measure prevents unauthorized access even if passwords are compromised.
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center">
                      <Server className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-800">Auth Configuration</span>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Compliant</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <div className="flex justify-between items-center p-4 animate-pulse bg-gradient-to-r from-white to-blue-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 mr-3 flex items-center justify-center text-xs text-gray-500">U1</div>
                        <div>
                          <div className="font-medium">admin@example.com</div>
                          <div className="text-xs text-gray-500">Administrator</div>
                        </div>
                      </div>
                      <div className="text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>MFA Enabled</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 mr-3 flex items-center justify-center text-xs text-gray-500">U2</div>
                        <div>
                          <div className="font-medium">user@example.com</div>
                          <div className="text-xs text-gray-500">Standard User</div>
                        </div>
                      </div>
                      <div className="text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>MFA Enabled</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 mr-3 flex items-center justify-center text-xs text-gray-500">U3</div>
                        <div>
                          <div className="font-medium">developer@example.com</div>
                          <div className="text-xs text-gray-500">Developer</div>
                        </div>
                      </div>
                      <div className="text-blue-600 flex items-center">
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        <span className="animate-pulse">Verifying...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* RLS Check */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-bold mb-2">Row Level Security</h3>
                  <p className="text-gray-600 mb-4">
                    Ensure Row Level Security policies are properly configured on all tables containing sensitive data.
                    RLS is essential for preventing unauthorized data access across your application.
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-indigo-600 mr-2" />
                      <span className="font-medium text-gray-800">Database Security</span>
                    </div>
                    <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span>Review Required</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <div className="flex justify-between items-center p-4">
                      <div>
                        <div className="font-medium">users</div>
                        <div className="text-xs text-gray-500">public schema</div>
                      </div>
                      <div className="text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>RLS Enabled</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 animate-pulse bg-gradient-to-r from-white to-amber-50">
                      <div>
                        <div className="font-medium">profiles</div>
                        <div className="text-xs text-gray-500">public schema</div>
                      </div>
                      <div className="text-amber-600 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>Needs Review</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4">
                      <div>
                        <div className="font-medium">transactions</div>
                        <div className="text-xs text-gray-500">public schema</div>
                      </div>
                      <div className="text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        <span>RLS Disabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* PITR Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-bold mb-2">Point in Time Recovery</h3>
                  <p className="text-gray-600 mb-4">
                    Verify that PITR is enabled with sufficient retention period. This ensures you can recover
                    your database to a specific point in time in case of data corruption or accidental deletion.
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="font-medium text-gray-800">Backup Configuration</span>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Compliant</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Retention Period:</span>
                      <span className="font-medium">7 days</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div className="bg-green-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Minimum (1 day)</span>
                      <span>Recommended (7 days)</span>
                    </div>
                    <div className="mt-6 text-sm">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>Automatic backups active</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>Backup schedule verified</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span>Last backup: Today at 08:45 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Why Compliance Matters</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Supabase provides powerful tools, but with great power comes great responsibility. Ensuring your
                configuration follows security best practices is essential for protecting your data.
              </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 lg:gap-8 xl:gap-10 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Shared Responsibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Running databases is a shared responsibility between you and Supabase. There are some things that
                    Supabase can take care of for you, and some things that you are responsible for. [^1]
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Security Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    You are responsible for applying security controls like Row Level Security (RLS) to protect
                    sensitive data and make sure users only access what they're allowed to see. [^2]
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Production Readiness</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Before going to production, you should ensure your project is secure, won't falter under expected
                    load, and remains available whilst in production. [^3][^4]
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 Supabase Compliance Checker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

