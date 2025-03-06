"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Clock, ArrowUpDown, ArrowUp, ArrowDown, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { useToast } from "@/components/ui/use-toast"

// Define sorting types
type SortField = "name" | "region" | "pitr_enabled"
type SortDirection = "asc" | "desc" | null

interface Project {
  id: string
  name: string
  pitr_enabled: boolean
  region: string
}

interface ProjectsListProps {
  projects: Project[]
  loading: boolean
  onEnablePitr: (projectId: string) => void
  selectedProjectId?: string | null
  isProjectView?: boolean
  onSelectProject?: (projectId: string) => void
}

export default function ProjectsList({ 
  projects, 
  loading, 
  onEnablePitr, 
  selectedProjectId = null, 
  isProjectView = false,
  onSelectProject
}: ProjectsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [enablingPitr, setEnablingPitr] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  // Add sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedPitrProjectId, setSelectedPitrProjectId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  // Log projects data when it changes
  useEffect(() => {
    console.log("ProjectsList received projects:", projects)
    console.log("ProjectsList selectedProjectId:", selectedProjectId)
    
    // Log each project ID for comparison
    projects.forEach(project => {
      console.log(`Project ID: ${project.id}, Selected: ${selectedProjectId === project.id}`)
    })
  }, [projects, selectedProjectId])

  const handleEnablePitr = (projectId: string) => {
    setEnablingPitr((prev) => [...prev, projectId])

    // Make sure we're passing the correct project information
    onEnablePitr(projectId)
    
    // Simulate enabling process with a delay before UI cleanup
    setTimeout(() => {
      setEnablingPitr((prev) => prev.filter((id) => id !== projectId))
      setIsSheetOpen(false); // Close the sheet after enabling
    }, 1500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "You can now paste the code in your console",
    })
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

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.region.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Apply sorting if active
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    if (sortField === "pitr_enabled") {
      // For boolean values
      if (sortDirection === "asc") {
        return a[sortField] === b[sortField] ? 0 : a[sortField] ? -1 : 1
      } else {
        return a[sortField] === b[sortField] ? 0 : a[sortField] ? 1 : -1
      }
    } else {
      // For string values
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
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, sortedProjects.length)
  const paginatedProjects = sortedProjects.slice(startIndex, endIndex)

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

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const passedCount = projects.filter((project) => project.pitr_enabled).length
  const failedCount = projects.length - passedCount

  // Log counts for debugging
  useEffect(() => {
    console.log(`ProjectsList counts - Total: ${projects.length}, Passed: ${passedCount}, Failed: ${failedCount}`)
  }, [projects, passedCount, failedCount])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects & PITR Status</CardTitle>
          <CardDescription>Checking Point in Time Recovery status for all projects</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading project data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If in project view mode and no project is selected, show a placeholder
  if (isProjectView && !selectedProjectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects & PITR Status</CardTitle>
          <CardDescription>Point in Time Recovery status for selected project</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground">Please select a project to view its PITR status.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If no projects are found, show a message
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects & PITR Status</CardTitle>
          <CardDescription>Point in Time Recovery status for all projects</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground">No projects found. Please run the compliance check again.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects & PITR Status</CardTitle>
            <CardDescription>
              {isProjectView && selectedProjectId 
                ? "Point in Time Recovery status for the selected project"
                : "Point in Time Recovery status for all projects across all accounts"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {passedCount} Passed
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {failedCount} Failed
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
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
                    onClick={() => handleSort("region")}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            Region
                            {getSortIcon("region")}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to sort by region</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("pitr_enabled")}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            PITR Status
                            {getSortIcon("pitr_enabled")}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to sort by PITR status</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProjects.map((project) => (
                    <TableRow 
                      key={project.id}
                      className={`${selectedProjectId === project.id ? "bg-muted/50 border-l-4 border-l-primary" : "hover:bg-muted/20"} transition-colors duration-200`}
                      onClick={() => {
                        if (onSelectProject) {
                          console.log(`Clicking on project with ID: ${project.id}`);
                          onSelectProject(project.id);
                        }
                      }}
                      style={{ cursor: onSelectProject ? 'pointer' : 'default' }}
                    >
                      <TableCell>
                        <div className="flex items-center">
                          {project.name}
                          {selectedProjectId === project.id && (
                            <span className="ml-2 text-xs text-primary font-medium">Selected</span>
                          )}
                          {onSelectProject && selectedProjectId !== project.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(click to select)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{project.region}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {project.pitr_enabled ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span>{project.pitr_enabled ? "Enabled" : "Disabled"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {!project.pitr_enabled && (
                          <Sheet open={isSheetOpen && selectedPitrProjectId === project.id} onOpenChange={(open) => {
                            setIsSheetOpen(open);
                            if (!open) setSelectedPitrProjectId(null);
                          }}>
                            <SheetTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPitrProjectId(project.id);
                                }}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Enable PITR
                              </Button>
                            </SheetTrigger>
                            <SheetContent onClick={(e) => e.stopPropagation()}>
                              <SheetHeader>
                                <div className="flex items-center mb-2">
                                  <Clock className="h-4 w-4 text-amber-600 mr-2" />
                                  <SheetTitle>Enable PITR for {project.name}</SheetTitle>
                                </div>
                                <SheetDescription>
                                  Enable Point-in-Time Recovery for this project to ensure data can be restored to any point in time.
                                </SheetDescription>
                              </SheetHeader>
                              
                              <div className="my-6 space-y-6">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Enable PITR for {project.name}</h4>
                                  <div className="bg-slate-900 text-slate-50 p-3 rounded-md text-xs font-mono relative mb-2">
                                    <pre>
                                      {`# Enable Point-in-Time Recovery for project ID: ${project.id}
supabase projects pitr enable --project-ref ${project.id} --region ${project.region}`}
                                    </pre>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-slate-50 bg-slate-800/50"
                                      onClick={() => copyToClipboard(`supabase projects pitr enable --project-ref ${project.id} --region ${project.region}`)}
                                    >
                                      <Copy className="h-3 w-3" />
                                      <span className="sr-only">Copy</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              <SheetFooter>
                                <SheetClose asChild>
                                  <Button variant="outline" onClick={(e) => e.stopPropagation()}>Cancel</Button>
                                </SheetClose>
                                <Button
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnablePitr(project.id);
                                  }}
                                  disabled={enablingPitr.includes(project.id)}
                                >
                                  {enablingPitr.includes(project.id) ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Enabling...
                                    </>
                                  ) : "Apply Fix"}
                                </Button>
                              </SheetFooter>
                            </SheetContent>
                          </Sheet>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {sortedProjects.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

