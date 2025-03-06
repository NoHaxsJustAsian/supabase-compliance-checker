"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { InfoIcon, ExternalLink } from "lucide-react"
import { storeCredentials } from "@/lib/auth-utils"

export function PATPopup() {
  const router = useRouter()
  const { user, storePAT, getPAT } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [pat, setPat] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  useEffect(() => {
    // Check if user is logged in and doesn't have a PAT
    const checkForPAT = async () => {
      if (!user) return
      
      const patData = await getPAT()
      if (!patData || !patData.pat) {
        // User is logged in but has no PAT - show the popup
        setIsOpen(true)
      }
    }
    
    checkForPAT()
  }, [user, getPAT])
  
  const handleSubmit = async () => {
    if (!pat) {
      setError("Please enter a Personal Access Token")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      // Validate credentials
      const response = await fetch("/api/validate-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          apiKey: pat,
          projectRef: null,
          checkAllProjects: true 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate PAT")
      }

      // Store credentials in Supabase if the user is logged in
      await storePAT(pat, null, true)
      
      // Also store in session storage as fallback
      storeCredentials(pat, null, true)
      
      setIsOpen(false)
      
      // Refresh the page to apply new PAT
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }
  
  const handleSkip = () => {
    setIsOpen(false)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Up Your Personal Access Token</DialogTitle>
          <DialogDescription>
            To use the Compliance Checker, you need to provide a Supabase Personal Access Token (PAT).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pat-input">Personal Access Token</Label>
            <Input 
              id="pat-input" 
              value={pat} 
              onChange={(e) => setPat(e.target.value)} 
              placeholder="sbp_..."
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
                  Supabase account page
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              </p>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save PAT"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 