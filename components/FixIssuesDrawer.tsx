"use client"

import { useState } from "react"
import { ShieldCheck, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Terminal, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ComplianceStatus, ProjectInfo } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"

type FixPriority = "required" | "recommended" | "suggested";

type FixType = {
  type: "mfa" | "rls" | "pitr"
  description: string
  impact: string
  priority: FixPriority
  commands: string[]
  externalLink?: {
    url: string
    label: string
  }
}

interface FixIssuesDrawerProps {
  projectId?: string
  projectName?: string
  isAllProjects?: boolean
  complianceStatus: ComplianceStatus
  onFixIssues: (projectId?: string) => void
  availableProjects?: ProjectInfo[]
  disabled?: boolean
}

export function FixIssuesDrawer({
  projectId,
  projectName,
  isAllProjects = false,
  complianceStatus,
  onFixIssues,
  availableProjects = [],
  disabled = false
}: FixIssuesDrawerProps) {
  const [open, setOpen] = useState(false)
  const [expandedFixes, setExpandedFixes] = useState<{[key: string]: boolean}>({})
  
  // Determine which fixes need to be applied
  const requiredFixes: FixType[] = []
  
  // MFA issues - now recommended instead of required
  if (complianceStatus.mfa?.status === "failed") {
    requiredFixes.push({
      type: "mfa",
      description: "Enable Multi-Factor Authentication",
      impact: "Enhanced security for user accounts by requiring a second verification factor",
      priority: "recommended",
      commands: [
        "# Configure MFA for your organization",
        "supabase auth config set auth.mfa.enabled=true",
        "",
        "# Create policy to enforce MFA for authenticated users",
        "-- Create policy \"Enforce MFA for all end users.\"",
        "on auth.users",
        "as restrictive",
        "to authenticated",
        "using ( (auth.jwt()->>'aal') = 'aal2' );"
      ]
    })
  }
  
  // RLS issues - remains required
  if (complianceStatus.rls?.status === "failed") {
    requiredFixes.push({
      type: "rls",
      description: "Enable Row-Level Security policies",
      impact: "Improved data security by restricting access to rows based on user permissions",
      priority: "required",
      commands: [
        "# For each table that needs RLS protection",
        "",
        "-- Enable RLS on a table",
        "ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;",
        "",
        "-- Create a basic policy",
        "CREATE POLICY \"Users can only view their own data\"",
        "ON table_name",
        "FOR ALL",
        "USING (auth.uid() = user_id);"
      ]
    })
  }
  
  // PITR issues - now suggested instead of required and requires Supabase add-on
  if (complianceStatus.pitr?.status === "failed") {
    requiredFixes.push({
      type: "pitr",
      description: "Enable Point-in-Time Recovery",
      impact: "Enhanced data resilience by allowing database restoration to any point in time",
      priority: "suggested",
      commands: [
        "# PITR requires enabling the add-on via Supabase dashboard",
        "# This will redirect you to the Supabase dashboard to enable this feature",
        "",
        "# Once enabled, you can configure the retention period (recommended: 7 days)"
      ],
      externalLink: {
        url: "https://supabase.com/dashboard/project/_/settings/addons",
        label: "Enable PITR Add-on in Supabase Dashboard"
      }
    })
  }
  
  // Animation variants for the dropdown content
  const dropdownVariants = {
    hidden: { 
      height: 0, 
      opacity: 0,
      marginTop: 0,
      transition: { 
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2 } 
      }
    },
    visible: { 
      height: "auto", 
      opacity: 1,
      marginTop: 12,
      transition: { 
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.25, delay: 0.05 } 
      }
    }
  }
  
  // Icon animation variants
  const iconVariants = {
    closed: { rotate: 0 },
    open: { rotate: 180 }
  }
  
  // Handle the apply action
  const handleApply = () => {
    // Call the fix issues function
    onFixIssues(projectId)
    // Close the drawer
    setOpen(false)
  }
  
  // Toggle expanded state for a fix
  const toggleExpanded = (index: number) => {
    setExpandedFixes(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }
  
  // Open external link in a new tab
  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  
  // Check if there are any issues to fix
  const hasIssuesToFix = requiredFixes.length > 0
  
  // Get title text based on context
  const getTitleText = () => {
    if (isAllProjects) return "Fix Compliance Issues Across All Projects"
    return projectName ? `Fix Compliance Issues for ${projectName}` : "Fix Compliance Issues"
  }
  
  // Get description text based on context
  const getDescriptionText = () => {
    if (isAllProjects) {
      return `The following changes will be applied to non-compliant projects${availableProjects.length > 0 ? ` (${availableProjects.length} total projects)` : ''}.`
    }
    return "The following changes will be applied to address compliance issues."
  }
  
  // Get badge variant based on priority
  const getBadgeInfo = (priority: FixPriority) => {
    switch (priority) {
      case "required":
        return { 
          variant: "outline", 
          className: "bg-red-100 text-red-800",
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          label: "Required"
        }
      case "recommended":
        return { 
          variant: "outline", 
          className: "bg-amber-100 text-amber-800",
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          label: "Recommended"
        }
      case "suggested":
        return { 
          variant: "outline", 
          className: "bg-blue-100 text-blue-800",
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          label: "Suggested"
        }
    }
  }
  
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant={hasIssuesToFix && !disabled ? "default" : "outline"}
          size="sm"
          disabled={!hasIssuesToFix || disabled}
          className={`whitespace-nowrap ${isAllProjects ? "min-w-[150px]" : "min-w-[100px]"} ${(!hasIssuesToFix || disabled) ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          {isAllProjects ? "Fix All Issues" : "Fix Issues"}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{getTitleText()}</DrawerTitle>
          <DrawerDescription>{getDescriptionText()}</DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="p-4 pt-0 max-h-[50vh]">
          {hasIssuesToFix ? (
            <div className="space-y-4">
              {requiredFixes.map((fix, index) => {
                const isExpanded = expandedFixes[index] || false
                const badgeInfo = getBadgeInfo(fix.priority)
                
                return (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center">
                          {fix.type === "mfa" && "Multi-Factor Authentication"}
                          {fix.type === "rls" && "Row-Level Security"}
                          {fix.type === "pitr" && "Point-in-Time Recovery"}
                          <Badge variant="outline" className={`ml-2 ${badgeInfo.className}`}>
                            {badgeInfo.icon} {badgeInfo.label}
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{fix.description}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleExpanded(index)}
                        className="ml-2"
                        aria-label={isExpanded ? "Hide commands" : "Show commands"}
                      >
                        <motion.div
                          animate={isExpanded ? "open" : "closed"}
                          variants={iconVariants}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    </div>
                    <div className="mt-2 text-sm bg-muted/50 p-2 rounded-md">
                      <span className="font-medium">Impact:</span> {fix.impact}
                    </div>
                    
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key={`dropdown-${index}`}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={dropdownVariants}
                          className="overflow-hidden"
                        >
                          <div className="bg-zinc-950 text-zinc-200 p-3 rounded-md font-mono text-xs overflow-x-auto">
                            <div className="flex items-center mb-2 text-zinc-400">
                              <Terminal className="h-3.5 w-3.5 mr-1.5" />
                              <span>Commands that would be executed:</span>
                            </div>
                            {fix.commands.map((cmd, cmdIndex) => (
                              <div key={cmdIndex} className={`${cmd.startsWith('#') ? 'text-zinc-500' : ''}`}>
                                {cmd || '\u00A0'}
                              </div>
                            ))}
                          </div>
                          
                          {fix.externalLink && (
                            <div className="mt-3">
                              <Button 
                                variant="outline"
                                size="sm"
                                className="w-full flex items-center justify-center text-blue-500 hover:text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => openExternalLink(fix.externalLink!.url)}
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                {fix.externalLink.label}
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No issues to fix</h3>
              <p className="text-muted-foreground mt-1">All compliance checks are passing.</p>
            </div>
          )}
          
          <Alert variant="destructive" className="mt-6 bg-amber-50 text-amber-800 border-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Safety Disclaimer</AlertTitle>
            <AlertDescription>
              This is a demo application. In a production environment, these changes would affect your actual Supabase projects.
              For safety reasons, this demo will only simulate the fix process without making real changes.
            </AlertDescription>
          </Alert>
        </ScrollArea>
        
        <DrawerFooter>
          <Button 
            disabled={!hasIssuesToFix} 
            onClick={handleApply} 
            size="lg"
            className={hasIssuesToFix ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Apply Fixes
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
} 