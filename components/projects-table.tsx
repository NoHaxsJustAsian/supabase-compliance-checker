"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ShieldCheck, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, ChevronsUpDown, Check } from "lucide-react"
import { ComplianceCheckResult, ComplianceStatus, ProjectComplianceMap, ProjectInfo } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pagination } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { FixIssuesDrawer } from "./FixIssuesDrawer"

// Define sorting types
type SortField = "name" | "organization_id" | "status" | "region" | "score"
type SortDirection = "asc" | "desc" | null

interface ProjectsTableProps {
  projects: ProjectInfo[]
  complianceMap: ProjectComplianceMap
  selectedProjectId: string | null
  onSelectProject: (projectId: string) => void
  onRunChecks: (projectId: string) => void
  onFixIssues: (projectId: string) => void
}

export default function ProjectsTable({
  projects,
  complianceMap,
  selectedProjectId,
  onSelectProject,
  onRunChecks,
  onFixIssues
}: ProjectsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [searchTerm, setSearchTerm] = useState("")
  // Add sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  // Add filter states
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  // Add popover states
  const [isRegionFilterOpen, setIsRegionFilterOpen] = useState(false)
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false)
  // Add search terms for filters
  const [regionSearchTerm, setRegionSearchTerm] = useState("")
  const [statusSearchTerm, setStatusSearchTerm] = useState("")
  // Add loading state for check button
  const [checkingProjectId, setCheckingProjectId] = useState<string | null>(null)
  
  // Helper functions defined at the top to avoid reference errors
  const getProjectStatusDisplay = (status?: string) => {
    // Map various status values to three categories
    if (!status) return { label: "Unknown", className: "bg-gray-100 text-gray-800" };
    
    // Active statuses
    if (["ACTIVE_HEALTHY", "ACTIVE_UNHEALTHY"].includes(status)) {
      return { label: "Active", className: "bg-green-100 text-green-800" };
    }
    
    // Inactive statuses
    if (["INACTIVE", "REMOVED", "PAUSE_FAILED"].includes(status)) {
      return { label: "Inactive", className: "bg-gray-100 text-gray-800" };
    }
    
    // Pending/Processing statuses
    if (["COMING_UP", "GOING_DOWN", "INIT_FAILED", "RESTORING", "UPGRADING", 
         "PAUSING", "RESTORE_FAILED", "RESTARTING", "RESIZING", "UNKNOWN"].includes(status)) {
      return { label: "Pending", className: "bg-blue-100 text-blue-800" };
    }
    
    // Default fallback
    return { label: status, className: "bg-gray-100 text-gray-800" };
  }
  
  const isProjectInactive = (status?: string) => {
    return !status || ["INACTIVE", "REMOVED", "PAUSE_FAILED"].includes(status);
  }
  
  // Extract unique regions and statuses for filters
  const uniqueRegions = Array.from(new Set(projects.map(project => project.region || "unknown"))).sort()
  const uniqueStatuses = Array.from(new Set(projects.map(project => {
    const statusInfo = getProjectStatusDisplay(project.status)
    return statusInfo.label
  }))).sort()
  
  const getComplianceScore = (projectId: string) => {
    const status = complianceMap[projectId]
    if (!status) return 0
    
    // Check if project is inactive
    const project = projects.find(p => p.id === projectId)
    if (project && isProjectInactive(project.status)) return 0
    
    // Calculate compliance score based on pass/fail status
    const totalChecks = 3 // MFA, RLS, PITR
    let passedChecks = 0
    
    if (status.mfa?.status === "passed") passedChecks += 1
    if (status.rls?.status === "passed") passedChecks += 1
    if (status.pitr?.status === "passed") passedChecks += 1
    
    return Math.round((passedChecks / totalChecks) * 100)
  }

  const getStatusBadge = (status?: "checking" | "passed" | "failed" | "error" | "inactive") => {
    if (!status || status === "checking") {
      return <Badge variant="outline" className="bg-gray-100"><AlertTriangle className="h-3 w-3 mr-1" /> Checking</Badge>
    }
    
    if (status === "passed") {
      return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Passed</Badge>
    }
    
    if (status === "error") {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>
    }
    
    if (status === "inactive") {
      return <Badge variant="outline" className="bg-gray-300 text-gray-700"><AlertTriangle className="h-3 w-3 mr-1" /> Inactive</Badge>
    }
    
    return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>
  }

  // New function to handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
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

  // Handle region filter selection
  const handleRegionSelect = (region: string) => {
    setRegionFilter(region)
    setIsRegionFilterOpen(false)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Handle status filter selection
  const handleStatusSelect = (status: string) => {
    setStatusFilter(status)
    setIsStatusFilterOpen(false)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Get count of projects for a region
  const getRegionCount = (region: string) => {
    if (region === "all") return projects.length
    return projects.filter(project => (project.region || "unknown") === region).length
  }

  // Get count of projects for a status
  const getStatusCount = (status: string) => {
    if (status === "all") return projects.length
    return projects.filter(project => getProjectStatusDisplay(project.status).label === status).length
  }

  // Helper to render sort icons
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
    if (sortDirection === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
    if (sortDirection === "desc") return <ArrowDown className="ml-2 h-4 w-4" />
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = searchTerm
      ? project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.region || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.organization_id?.toString().includes(searchTerm)
      : true;
    
    // Region filter
    const matchesRegion = regionFilter === "all" || 
      (project.region || "unknown") === regionFilter;
    
    // Status filter
    const matchesStatus = statusFilter === "all" || 
      getProjectStatusDisplay(project.status).label === statusFilter;
    
    return matchesSearch && matchesRegion && matchesStatus;
  });

  // Apply sorting if active
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    if (sortField === "score") {
      // For compliance score
      const scoreA = getComplianceScore(a.id)
      const scoreB = getComplianceScore(b.id)
      
      if (sortDirection === "asc") {
        return scoreA - scoreB
      } else {
        return scoreB - scoreA
      }
    } else if (sortField === "status") {
      // For status values
      const statusA = getProjectStatusDisplay(a.status).label
      const statusB = getProjectStatusDisplay(b.status).label
      
      if (sortDirection === "asc") {
        return statusA > statusB ? 1 : statusA < statusB ? -1 : 0
      } else {
        return statusA < statusB ? 1 : statusA > statusB ? -1 : 0
      }
    } else {
      // For string values
      const compareA = (a[sortField] || "").toString().toLowerCase()
      const compareB = (b[sortField] || "").toString().toLowerCase()
      
      if (sortDirection === "asc") {
        return compareA > compareB ? 1 : compareA < compareB ? -1 : 0
      } else {
        return compareA < compareB ? 1 : compareA > compareB ? -1 : 0
      }
    }
  })

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, sortedProjects.length)
  const currentProjects = sortedProjects.slice(startIndex, endIndex)
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [regionFilter, statusFilter, searchTerm])

  // Filter regions based on search term
  const filteredRegions = regionSearchTerm
    ? uniqueRegions.filter(region => 
        region.toLowerCase().includes(regionSearchTerm.toLowerCase()))
    : uniqueRegions;

  // Filter statuses based on search term
  const filteredStatuses = statusSearchTerm
    ? uniqueStatuses.filter(status => 
        status.toLowerCase().includes(statusSearchTerm.toLowerCase()))
    : uniqueStatuses;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Click on a project row to view detailed compliance information.
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-60"
          />
          
          {/* Applied filter badges */}
          <div className="flex gap-2">
            {regionFilter !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                Region: {regionFilter}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => setRegionFilter("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {statusFilter !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                Status: {statusFilter}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => setStatusFilter("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[250px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("name")}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        Project Name
                        {getSortIcon("name")}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to sort by project name</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("organization_id")}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        Organization ID
                        {getSortIcon("organization_id")}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to sort by organization ID</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead>
                <Popover open={isStatusFilterOpen} onOpenChange={setIsStatusFilterOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                      Status
                      <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search statuses..." 
                        value={statusSearchTerm}
                        onValueChange={setStatusSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>No statuses found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem 
                            onSelect={() => handleStatusSelect("all")}
                            className="flex justify-between items-center"
                          >
                            <span>All Statuses</span>
                            <Badge variant="outline">{projects.length}</Badge>
                            {statusFilter === "all" && (
                              <Check className="h-4 w-4 ml-2" />
                            )}
                          </CommandItem>
                          {filteredStatuses.map(status => (
                            <CommandItem 
                              key={status}
                              onSelect={() => handleStatusSelect(status)}
                              className="flex justify-between items-center"
                            >
                              <span>{status}</span>
                              <Badge variant="outline">{getStatusCount(status)}</Badge>
                              {statusFilter === status && (
                                <Check className="h-4 w-4 ml-2" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </TableHead>
              <TableHead>
                <Popover open={isRegionFilterOpen} onOpenChange={setIsRegionFilterOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                      Region
                      <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search regions..." 
                        value={regionSearchTerm}
                        onValueChange={setRegionSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>No regions found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem 
                            onSelect={() => handleRegionSelect("all")}
                            className="flex justify-between items-center"
                          >
                            <span>All Regions</span>
                            <Badge variant="outline">{projects.length}</Badge>
                            {regionFilter === "all" && (
                              <Check className="h-4 w-4 ml-2" />
                            )}
                          </CommandItem>
                          {filteredRegions.map(region => (
                            <CommandItem 
                              key={region}
                              onSelect={() => handleRegionSelect(region)}
                              className="flex justify-between items-center"
                            >
                              <span>{region}</span>
                              <Badge variant="outline">{getRegionCount(region)}</Badge>
                              {regionFilter === region && (
                                <Check className="h-4 w-4 ml-2" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </TableHead>
              <TableHead>MFA Status</TableHead>
              <TableHead>RLS Status</TableHead>
              <TableHead>PITR Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("score")}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        Compliance Score
                        {getSortIcon("score")}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to sort by compliance score</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              currentProjects.map((project) => {
                const compliance = complianceMap[project.id]
                const score = getComplianceScore(project.id)
                const isSelected = selectedProjectId === project.id
                
                return (
                  <TableRow 
                    key={project.id} 
                    className={`${
                      isSelected 
                        ? "bg-muted/50 relative after:absolute after:left-0 after:top-[2%] after:h-[96%] after:w-[4px] after:bg-primary after:transform-gpu after:opacity-100 after:rounded-r-sm after:shadow-sm" 
                        : "hover:bg-muted/20 relative after:absolute after:left-0 after:top-1/2 after:h-0 after:w-[3px] after:bg-primary after:opacity-0 after:transform-gpu after:rounded-r-sm after:-translate-y-1/2"
                    } relative transition-colors duration-200 ease-out cursor-pointer
                      after:transition-all after:duration-300 after:ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {project.name}
                        {isSelected && <ChevronRight className="ml-2 h-4 w-4 text-primary" />}
                      </div>
                    </TableCell>
                    <TableCell>{project.organization_id || "N/A"}</TableCell>
                    <TableCell>
                      {(() => {
                        const statusInfo = getProjectStatusDisplay(project.status);
                        return (
                          <Badge variant="outline" className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{project.region || "unknown"}</TableCell>
                    <TableCell>
                      {isProjectInactive(project.status) 
                        ? getStatusBadge("inactive") 
                        : getStatusBadge(compliance?.mfa?.status)}
                    </TableCell>
                    <TableCell>
                      {isProjectInactive(project.status) 
                        ? getStatusBadge("inactive") 
                        : getStatusBadge(compliance?.rls?.status)}
                    </TableCell>
                    <TableCell>
                      {isProjectInactive(project.status) 
                        ? getStatusBadge("inactive") 
                        : getStatusBadge(compliance?.pitr?.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-medium">{score}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isProjectInactive(project.status) ? (
                          <TooltipProvider>
                            <Tooltip delayDuration={50}>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={true}
                                    className="opacity-50 cursor-not-allowed"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                    Check
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Server is inactive</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCheckingProjectId(project.id);
                              onRunChecks(project.id);
                              // Reset loading state after 2 seconds to ensure animation plays
                              setTimeout(() => setCheckingProjectId(null), 2000);
                            }}
                            disabled={checkingProjectId === project.id}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${checkingProjectId === project.id ? 'animate-spin' : ''}`} />
                            Check
                          </Button>
                        )}
                        
                        {score === 100 ? (
                          <TooltipProvider>
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    disabled={true}
                                    className="opacity-50 cursor-not-allowed"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                    Fix
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>All compliance checks have passed, no fixes needed</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <FixIssuesDrawer 
                            projectId={project.id}
                            projectName={project.name}
                            complianceStatus={complianceMap[project.id] || {
                              mfa: { status: "checking", details: [], percentage: 0 },
                              rls: { status: "checking", details: [], percentage: 0 },
                              pitr: { status: "checking", details: [], percentage: 0 },
                            }}
                            onFixIssues={(projectId) => {
                              if (projectId) {
                                onFixIssues(projectId);
                              }
                            }}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {sortedProjects.length > itemsPerPage && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
} 