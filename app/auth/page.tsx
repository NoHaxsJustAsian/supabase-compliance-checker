"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldAlert, ExternalLink, InfoIcon, AlertCircle, Eye, EyeOff, Download, ArrowLeft, UserPlus, LogIn } from "lucide-react"
import { storeCredentials } from "@/lib/auth-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { checkSupabaseConnection } from '@/lib/supabase'
import Link from "next/link"

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp, storePAT } = useAuth()
  
  // PAT related state
  const [apiKey, setApiKey] = useState("")
  
  // Auth related states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [authTab, setAuthTab] = useState("login") // "login" or "pat"
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Test Supabase connection on component load
    const testConnection = async () => {
      console.log("Testing Supabase connection...");
      const result = await checkSupabaseConnection();
      console.log("Connection test result:", result);
    };
    
    testConnection();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate passwords match for signup
      if (isSignUp && password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      console.log("Attempting authentication:", isSignUp ? "signup" : "signin")
      
      const result = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)
        
      console.log("Auth result:", result)

      if (result.error) {
        console.error("Auth error:", result.error)
        throw new Error(result.error.message || "Authentication failed")
      }

      console.log("Authentication successful")
      
      if (isSignUp) {
        // After signing up, show a success message and switch back to sign in
        setError("Account created! Check your email to confirm your account before logging in.")
        setIsSignUp(false)
      } else {
        // Redirect directly to dashboard after sign in
        console.log("Redirecting to dashboard after sign in")
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Auth error details:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handlePATSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate credentials - always use checkAllProjects true with PAT
      const response = await fetch("/api/validate-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          apiKey,
          projectRef: null,
          checkAllProjects: true
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate credentials")
      }

      // Store credentials in Supabase if the user is logged in
      await storePAT(apiKey, null, true)
      
      // Also store in session storage as fallback
      storeCredentials(apiKey, null, true)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <ShieldAlert className="mx-auto h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">Supabase Compliance Checker</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your Supabase compliance checks
          </p>
        </div>

        <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Account</TabsTrigger>
            <TabsTrigger value="pat">API Access</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <form onSubmit={handleEmailAuth}>
                <CardHeader>
                  <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
                  <CardDescription>
                    {isSignUp 
                      ? "Create an account to save your compliance results" 
                      : "Sign in to your account to view your saved results"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showConfirmPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <Alert variant={error.includes("created") ? "default" : "destructive"}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
                  </Button>
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {isSignUp ? "Or" : "New here?"}
                      </span>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant={isSignUp ? "outline" : "secondary"}
                    className="w-full text-sm gap-2"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError("")
                    }}
                  >
                    {isSignUp ? (
                      <>
                        <LogIn className="h-4 w-4" />
                        Already have an account? Sign in
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Don't have an account? Sign up
                      </>
                    )}
                  </Button>
                  <Link href="/" className="w-full mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" /> Return to Home
                    </Button>
                  </Link>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="pat">
            <Card>
              <form onSubmit={handlePATSubmit}>
                <CardHeader>
                  <CardTitle>Supabase Access</CardTitle>
                  <CardDescription>
                    Enter your Supabase Personal Access Token (PAT) to begin compliance checks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Personal Access Token (PAT)</Label>
                    <Input
                      id="apiKey"
                      placeholder="sbp_••••••••••••••••••••••••••••••••••••xxxx"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      required
                    />
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <InfoIcon className="h-3.5 w-3.5 shrink-0 translate-y-0.5" />
                      <p>
                        Generate a PAT from your{" "}
                        <a 
                          href="https://app.supabase.com/account/tokens" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center hover:underline"
                        >
                          account page
                          <ExternalLink className="h-3 w-3 ml-0.5" />
                        </a>
                        . PATs allow checking multiple projects.
                      </p>
                    </div>
                  </div>
                  
                  <Alert>
                    <Download className="h-4 w-4" />
                    <AlertDescription>
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> When using API access without an account, logs are stored in your browser session only. 
                        To save your results permanently, either:
                      </p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 ml-4">
                        <li>Download logs as CSV when available</li>
                        <li>Sign up for an account to save logs automatically</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Connecting..." : "Connect"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Management API is rate limited to 60 requests per minute
                  </p>
                  <Link href="/" className="w-full">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" /> Return to Home
                    </Button>
                  </Link>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

