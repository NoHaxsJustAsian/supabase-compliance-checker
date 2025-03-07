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
import { motion } from "framer-motion"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      delayChildren: 0.1,
      staggerChildren: 0.1 
    } 
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    } 
  }
}

const tabVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

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
    // Check for tab parameter in URL
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'pat') {
      setAuthTab('pat');
    }

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
    <motion.div 
      className="container flex h-screen w-screen flex-col items-center justify-center"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]"
        variants={itemVariants}
      >
        <motion.div 
          className="flex flex-col space-y-2 text-center"
          variants={itemVariants}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto"
          >
            <ShieldAlert className="h-6 w-6" />
          </motion.div>
          <motion.h1 
            className="text-2xl font-semibold tracking-tight"
            variants={itemVariants}
          >
            Supabase Compliance Checker
          </motion.h1>
          <motion.p 
            className="text-sm text-muted-foreground"
            variants={itemVariants}
          >
            Sign in to manage your Supabase compliance checks
          </motion.p>
        </motion.div>

        <motion.div variants={tabVariants}>
          <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Account</TabsTrigger>
              <TabsTrigger value="pat">API Access</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <motion.div variants={cardVariants}>
                <Card className="border-2 hover:border-primary/40 transition-all">
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
                      <motion.div 
                        className="space-y-2"
                        variants={itemVariants}
                      >
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </motion.div>
                      <motion.div 
                        className="space-y-2"
                        variants={itemVariants}
                      >
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
                      </motion.div>
                      
                      {isSignUp && (
                        <motion.div 
                          className="space-y-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
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
                        </motion.div>
                      )}
                      
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert variant={error.includes("created") ? "default" : "destructive"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {error}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <motion.div
                        variants={itemVariants}
                      >
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
                        </Button>
                      </motion.div>
                      <motion.div className="relative w-full" variants={itemVariants}>
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            {isSignUp ? "Or" : "New here?"}
                          </span>
                        </div>
                      </motion.div>
                      <motion.div
                        variants={itemVariants}
                      >
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
                      </motion.div>
                      <motion.div
                        variants={itemVariants}
                      >
                        <Link href="/" className="w-full">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full gap-2"
                          >
                            <ArrowLeft className="h-4 w-4" /> Return to Home
                          </Button>
                        </Link>
                      </motion.div>
                    </CardFooter>
                  </form>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="pat">
              <motion.div variants={cardVariants}>
                <Card className="border-2 hover:border-primary/40 transition-all">
                  <form onSubmit={handlePATSubmit}>
                    <CardHeader>
                      <CardTitle>Supabase Access</CardTitle>
                      <CardDescription>
                        Enter your Supabase Personal Access Token (PAT) to begin compliance checks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div 
                        className="space-y-2"
                        variants={itemVariants}
                      >
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
                      </motion.div>
                      
                      <motion.div variants={itemVariants}>
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
                      </motion.div>
                      
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <motion.div
                        variants={itemVariants}
                      >
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Connecting..." : "Connect"}
                        </Button>
                      </motion.div>
                      <motion.p 
                        className="text-xs text-center text-muted-foreground"
                        variants={itemVariants}
                      >
                        Management API is rate limited to 60 requests per minute
                      </motion.p>
                      <motion.div
                        variants={itemVariants}
                      >
                        <Link href="/" className="w-full">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full gap-2"
                          >
                            <ArrowLeft className="h-4 w-4" /> Return to Home
                          </Button>
                        </Link>
                      </motion.div>
                    </CardFooter>
                  </form>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

