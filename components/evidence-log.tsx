"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Filter, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Lightbulb, Wrench, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"

// Define sorting types
type SortField = "timestamp" | "project" | "check" | "status" | "details"
type SortDirection = "asc" | "desc" | null

interface Log {
  check: string
  status: string
  details: string
  timestamp: string
  project?: string
  projectId?: string
}

interface EvidenceLogProps {
  logs: Log[]
  onSelectProject?: (projectId: string) => void
  isProjectView?: boolean
  onRefresh?: () => void
  addEvidenceLog?: (log: Omit<Log, 'timestamp'> & { timestamp?: string }) => void
}

export default function EvidenceLog({ logs, onSelectProject, isProjectView = false, onRefresh, addEvidenceLog }: EvidenceLogProps) {
  const { toast } = useToast()
  const [filter, setFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  // Add sorting state
  const [sortField, setSortField] = useState<SortField>("timestamp")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [activeFixLog, setActiveFixLog] = useState<Log | null>(null)

  // Extract unique projects from logs
  const uniqueProjects = Array.from(new Set(logs.filter(log => log.project).map(log => log.project)))

  const handleExportLogs = () => {
    // Create CSV content
    const headers = ["Timestamp", "Project", "ProjectId", "Check", "Status", "Details"]
    const csvContent = [
      headers.join(","),
      ...logs.map((log) =>
        [
          new Date(log.timestamp).toISOString(), 
          log.project || "N/A", 
          log.projectId || "N/A",
          log.check, 
          log.status, 
          `"${log.details.replace(/"/g, '""')}"`
        ].join(","),
      ),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `compliance-evidence-${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const applyFix = (log: Log) => {
    // Determine which type of fix to apply based on the check type
    // Make sure to use the log's projectId for the correct project attribution
    let fixDescription = "";
    let checkType = "";
    
    if (log.check.toLowerCase().includes('mfa')) {
      // Handle MFA fix
      checkType = "MFA Enforcement";
      fixDescription = `Enforced MFA for project: ${log.project || "Unknown"}`;
      toast({
        title: "MFA Fix Applied",
        description: fixDescription,
      });
    } else if (log.check.toLowerCase().includes('rls')) {
      // Handle RLS fix
      checkType = "RLS Enforcement";
      fixDescription = `Enabled RLS for project: ${log.project || "Unknown"}`;
      toast({
        title: "RLS Fix Applied",
        description: fixDescription,
      });
    } else if (log.check.toLowerCase().includes('pitr')) {
      // Handle PITR fix
      checkType = "PITR Enablement";
      fixDescription = `Enabled PITR for project: ${log.project || "Unknown"}`;
      toast({
        title: "PITR Fix Applied",
        description: fixDescription,
      });
    } else {
      // Generic fix
      checkType = log.check;
      fixDescription = `Fixed issue: ${log.check} for project: ${log.project || "Unknown"}`;
      toast({
        title: "Fix Applied",
        description: fixDescription,
      });
    }
    
    // Create a new log entry for the fix action
    if (addEvidenceLog) {
      addEvidenceLog({
        check: checkType,
        status: "ACTION",
        details: fixDescription,
        project: log.project,
        projectId: log.projectId
      });
    }
    
    // If we have a refresh function, call it to update the logs
    if (onRefresh) {
      onRefresh();
    }
    
    // Close the sheet after applying
    setActiveFixLog(null);
  }

  // New function to handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        // Instead of setting to null, set to default "timestamp" with "desc" direction
        setSortField("timestamp")
        setSortDirection("desc")
      } else {
        setSortDirection("asc")
      }
    } else {
      // New field, start with ascending
      setSortField(field)
      setSortDirection("asc")
    }
    // Reset to first page when sort changes
    setCurrentPage(1)
  }

  // Apply both status and project filters
  const filteredLogs = logs.filter(log => {
    const statusMatch = filter === "all" || log.status === filter
    const projectMatch = projectFilter === "all" || log.project === projectFilter
    return statusMatch && projectMatch
  })

  // Apply sorting if active
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    if (sortField === "timestamp") {
      // For date values
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      
      if (sortDirection === "asc") {
        return dateA - dateB
      } else {
        return dateB - dateA
      }
    } else if (sortField === "project") {
      // For optional string values
      const compareA = (a[sortField] || "").toLowerCase()
      const compareB = (b[sortField] || "").toLowerCase()
      
      if (sortDirection === "asc") {
        return compareA > compareB ? 1 : compareA < compareB ? -1 : 0
      } else {
        return compareA < compareB ? 1 : compareA > compareB ? -1 : 0
      }
    } else {
      // For regular string values
      const compareA = a[sortField].toLowerCase()
      const compareB = b[sortField].toLowerCase()
      
      if (sortDirection === "asc") {
        return compareA > compareB ? 1 : compareA < compareB ? -1 : 0
      } else {
        return compareA < compareB ? 1 : compareA > compareB ? -1 : 0
      }
    }
  })

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, sortedLogs.length)
  const paginatedLogs = sortedLogs.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Helper to render sort icons
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
    if (sortDirection === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
    if (sortDirection === "desc") return <ArrowDown className="ml-2 h-4 w-4" />
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, projectFilter])

  // Generate fix content based on the check type
  const getFixContent = (log: Log) => {
    const projectInfo = log.project ? ` for project "${log.project}"` : "";
    
    switch(log.check.toLowerCase()) {
      case 'mfa check':
        return (
          <div className="my-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">1. Enable MFA{projectInfo}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Implement a policy to enforce multi-factor authentication for all your users.
              </p>
              {log.projectId && (
                <p className="text-xs text-blue-600">Project ID: {log.projectId}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">2. Update authentication settings</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Configure your application to require MFA for sensitive operations.
              </p>
            </div>
          </div>
        )
      case 'rls check':
        return (
          <div className="my-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">1. Enable RLS on all tables{projectInfo}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Implement Row Level Security on all tables to restrict data access.
              </p>
              {log.projectId && (
                <p className="text-xs text-blue-600">Project ID: {log.projectId}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">2. Create appropriate policies</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Define access policies that match your application's security requirements.
              </p>
            </div>
          </div>
        )
      case 'pitr check':
        return (
          <div className="my-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">1. Enable Point-in-Time Recovery{projectInfo}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Navigate to your project settings and enable the PITR feature.
              </p>
              {log.projectId && (
                <p className="text-xs text-blue-600">Project ID: {log.projectId}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">2. Configure retention period</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Set an appropriate retention window based on your compliance requirements.
              </p>
            </div>
          </div>
        )
      default:
        return (
          <div className="my-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Proposed fix for {log.check}{projectInfo}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {log.details}
              </p>
              {log.projectId && (
                <p className="text-xs text-blue-600">Project ID: {log.projectId}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Recommendation</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Review the issue details and implement appropriate compliance measures.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evidence Logs</CardTitle>
            <CardDescription>Detailed logs of compliance checks and actions</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PASSED">Passed Only</SelectItem>
                <SelectItem value="FAILED">Failed Only</SelectItem>
                <SelectItem value="ACTION">Actions Only</SelectItem>
                <SelectItem value="ERROR">Errors Only</SelectItem>
              </SelectContent>
            </Select>
            
            {uniqueProjects.length > 0 && (
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.map(project => (
                    <SelectItem key={project} value={project || ""}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
            
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-2 h-4 w-4"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Refresh Logs
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("timestamp")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          Timestamp
                          {getSortIcon("timestamp")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by timestamp</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("project")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          Project
                          {getSortIcon("project")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by project</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("check")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          Check
                          {getSortIcon("check")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by check type</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("status")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          Status
                          {getSortIcon("status")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("details")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          Details
                          {getSortIcon("details")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      {!isProjectView && onSelectProject && log.project ? (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 m-0 text-left font-normal" 
                          onClick={() => onSelectProject(log.projectId || log.project || "")}
                        >
                          {log.project}
                        </Button>
                      ) : (
                        log.project || "—"
                      )}
                    </TableCell>
                    <TableCell>{log.check}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          log.status === "PASSED"
                            ? "bg-green-100 text-green-800"
                            : log.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : log.status === "ACTION"
                                ? "bg-blue-100 text-blue-800"
                                : log.status === "ERROR"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={log.details}>
                      {log.details}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        {/* View Suggestions Button */}
                        {!isProjectView && onSelectProject && log.project && (
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => onSelectProject(log.projectId || log.project || "")}
                             className="px-2 py-1"
                           >
                             <Lightbulb className="mr-1 h-3 w-3" />
                             View Suggestions
                           </Button>
                        )}

                        {/* Fix Button */}
                        {(log.status === "FAILED" || log.status === "ACTION") && (
                          <Sheet open={activeFixLog === log} onOpenChange={(open) => setActiveFixLog(open ? log : null)}>
                            <SheetTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Wrench className="mr-1 h-3 w-3" />
                                Fix
                              </Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <div className="flex items-center mb-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                                  <SheetTitle>Fix {log.check}</SheetTitle>
                                </div>
                                <SheetDescription>
                                  Apply the recommended fix for this compliance issue
                                </SheetDescription>
                              </SheetHeader>
                              
                              {getFixContent(log)}
                              
                              <SheetFooter>
                                <SheetClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </SheetClose>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => applyFix(log)}>Apply Fix</Button>
                              </SheetFooter>
                            </SheetContent>
                          </Sheet>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {sortedLogs.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </CardContent>
    </Card>
  )
}

