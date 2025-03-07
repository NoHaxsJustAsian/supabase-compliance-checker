"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function UserMenu() {
  const router = useRouter()
  const { user, signOut, storePAT } = useAuth()
  const [patDialogOpen, setPatDialogOpen] = useState(false)
  const [pat, setPat] = useState("")
  
  const handleSignOut = async () => {
    try {
      console.log("Starting sign out process");
      // Call the auth context signOut method
      const { error } = await signOut();
      
      if (error) {
        console.error("Error from signOut:", error);
        // Force redirect even if there was an error from the signOut function
        router.push('/auth');
      } else {
        console.log("Sign out successful");
        // The router.push() is already called in the signOut function,
        // but we'll add it here as a fallback just in case
        router.push('/auth');
      }
    } catch (error) {
      console.error("Exception during sign out:", error);
      // Force redirect to auth page as a final fallback
      window.location.href = '/auth';
    }
  }
  
  const handleUpdatePAT = async () => {
    try {
      // Always use PAT mode now (no service role)
      await storePAT(pat, null, true)
      setPatDialogOpen(false)
      // Refresh the page to apply new PAT
      window.location.reload()
    } catch (error) {
      console.error("Error updating PAT:", error)
    }
  }
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          {user && <DropdownMenuLabel className="font-normal text-xs truncate">{user.email}</DropdownMenuLabel>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPatDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>API Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={patDialogOpen} onOpenChange={setPatDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update API Credentials</DialogTitle>
            <DialogDescription>
              Update your Supabase Personal Access Token (PAT).
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
              <p className="text-xs text-muted-foreground">
                Generate a PAT from your <a href="https://app.supabase.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase account page</a>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdatePAT}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 