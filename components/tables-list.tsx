"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, ShieldCheck, Database, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Check, ChevronsUpDown, Copy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
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
type SortField = "name" | "rls_enabled" | "project_name" | "schema"
type SortDirection = "asc" | "desc" | null

interface TableData {
  id: string
  name: string
  schema: string
  rls_enabled: boolean
  project_id?: string
  project_name?: string
}

interface TablesListProps {
  tables: TableData[]
  loading: boolean
  onEnableRls: (tableId: string) => void
  isProjectView?: boolean
  selectedProjectId?: string | null
  rawTables?: any[]
}

export default function TablesList({ 
  tables, 
  loading, 
  onEnableRls, 
  isProjectView = false,
  selectedProjectId = null,
  rawTables = []
}: TablesListProps) {
  // Add console logging to understand what data we're receiving
  useEffect(() => {
    console.log('TablesList received tables:', tables.length);
    if (tables.length > 0) {
      console.log('First few tables with project info:', tables.slice(0, 3).map(t => ({
        name: t.name, 
        project_id: t.project_id,
        project_name: t.project_name
      })));
    }
  }, [tables]);

  const [searchTerm, setSearchTerm] = useState("")
  const [enablingRls, setEnablingRls] = useState<string[]>([])
  const [isRawDataOpen, setIsRawDataOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  // Add sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  // Add schema filter state
  const [schemaFilter, setSchemaFilter] = useState<string>("all")
  // Add state for schema filter popover
  const [isSchemaFilterOpen, setIsSchemaFilterOpen] = useState(false)
  // Add schema search term state
  const [schemaSearchTerm, setSchemaSearchTerm] = useState("")
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  // Extract unique schemas for filter
  const uniqueSchemas = Array.from(new Set(tables.map(table => table.schema))).sort()

  const handleEnableRls = (tableId: string) => {
    setEnablingRls((prev) => [...prev, tableId])

    // Make sure we're passing the table ID to the callback
    onEnableRls(tableId);
    
    // Simulate enabling process with a delay before UI cleanup
    setTimeout(() => {
      setEnablingRls((prev) => prev.filter((id) => id !== tableId))
      setIsSheetOpen(false); // Close the sheet after enabling
    }, 1500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "You can now paste the SQL code in your query editor",
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

  // Function to handle schema selection
  const handleSchemaSelect = (schema: string) => {
    setSchemaFilter(schema)
    setIsSchemaFilterOpen(false)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Get count of tables for a schema
  const getSchemaCount = (schema: string) => {
    if (schema === "all") return tables.length
    return tables.filter(table => table.schema === schema).length
  }

  // Apply search and schema filters
  const filteredTables = tables.filter(table => {
    // Search filter
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         table.schema.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Schema filter
    const matchesSchema = schemaFilter === "all" || table.schema === schemaFilter;
    
    // Project filter - only apply in project view mode
    const matchesProject = !isProjectView || !selectedProjectId || table.project_id === selectedProjectId;
    
    return matchesSearch && matchesSchema && matchesProject;
  })

  // Apply sorting if active
  const sortedTables = [...filteredTables].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    if (sortField === "rls_enabled") {
      // For boolean values
      if (sortDirection === "asc") {
        return a[sortField] === b[sortField] ? 0 : a[sortField] ? -1 : 1
      } else {
        return a[sortField] === b[sortField] ? 0 : a[sortField] ? 1 : -1
      }
    } else if (sortField === "project_name") {
      // For optional string values like project_name
      const valueA = a[sortField] || "";
      const valueB = b[sortField] || "";
      
      if (sortDirection === "asc") {
        return valueA.toLowerCase() > valueB.toLowerCase() ? 1 : valueA.toLowerCase() < valueB.toLowerCase() ? -1 : 0
      } else {
        return valueA.toLowerCase() < valueB.toLowerCase() ? 1 : valueA.toLowerCase() > valueB.toLowerCase() ? -1 : 0
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
  const totalPages = Math.max(1, Math.ceil(sortedTables.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, sortedTables.length)
  const paginatedTables = sortedTables.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to first page when search term or schema filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, schemaFilter])

  // Filter schemas based on search term
  const filteredSchemas = schemaSearchTerm 
    ? uniqueSchemas.filter(schema => 
        schema.toLowerCase().includes(schemaSearchTerm.toLowerCase()))
    : uniqueSchemas;

  // Helper to render sort icons
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
    if (sortDirection === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
    if (sortDirection === "desc") return <ArrowDown className="ml-2 h-4 w-4" />
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  const passedCount = tables.filter((table) => table.rls_enabled).length
  const failedCount = tables.length - passedCount

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-foreground">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            Tables & RLS Status
          </CardTitle>
          <CardDescription>Checking Row Level Security status for all tables</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Loading table data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If in project view mode and no project is selected, show a placeholder
  if (isProjectView && !selectedProjectId) {
    return (
      <Card className="border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-foreground">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            Tables & RLS Status
          </CardTitle>
          <CardDescription>Select a project to view tables</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <Database className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Please select a project to view RLS status for tables.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tables.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-foreground">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            Tables & RLS Status
          </CardTitle>
          <CardDescription>No tables found in selected project</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <Database className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tables found. Please check your database configuration.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-foreground dark:text-white">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            Tables & RLS Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-0 hover:bg-green-100 hover:text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>{passedCount} Secured</span>
            </Badge>
            {failedCount > 0 && (
              <Badge className="bg-red-100 text-red-800 border-0 hover:bg-red-100 hover:text-red-800">
                <XCircle className="h-3 w-3 mr-1" />
                <span>{failedCount} Unsecured</span>
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="dark:text-gray-300">
          Row Level Security status for all database tables
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-4">
        <div className="flex justify-between items-center px-6 mb-4">
          <div className="flex items-center gap-2">
            {/* Schema filter */}
            <Popover open={isSchemaFilterOpen} onOpenChange={setIsSchemaFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="text-sm gap-1 h-9 px-3 border-border hover:bg-muted/50">
                  <Filter className="h-3.5 w-3.5 text-blue-600" />
                  {schemaFilter === "all" ? "All Schemas" : schemaFilter}
                  <Badge variant="secondary" className="ml-1 h-5 text-xs bg-gray-100">
                    {getSchemaCount(schemaFilter)}
                  </Badge>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search schemas..." 
                    value={schemaSearchTerm}
                    onValueChange={setSchemaSearchTerm}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No schemas found</CommandEmpty>
                    <CommandGroup>
                      <CommandItem 
                        onSelect={() => handleSchemaSelect("all")}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center">
                          <span>All Schemas</span>
                        </div>
                        <Badge variant="secondary" className="ml-1 h-5 text-xs">
                          {tables.length}
                        </Badge>
                        {schemaFilter === "all" && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </CommandItem>
                      {filteredSchemas.map(schema => (
                        <CommandItem 
                          key={schema}
                          onSelect={() => handleSchemaSelect(schema)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center">
                            <span>{schema}</span>
                          </div>
                          <Badge variant="secondary" className="ml-1 h-5 text-xs">
                            {tables.filter(t => t.schema === schema).length}
                          </Badge>
                          {schemaFilter === schema && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="relative w-64">
            <Input
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 border-gray-200 focus-visible:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                className="absolute right-0 top-0 h-9 w-9 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800">
          <Table>
            <TableHeader className="bg-muted/50 dark:bg-muted/20">
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("name")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          Table Name
                          {getSortIcon("name")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by table name</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("schema")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          Schema
                          {getSortIcon("schema")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by schema</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("rls_enabled")}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          RLS Status
                          {getSortIcon("rls_enabled")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by RLS status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                {!isProjectView && (
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("project_name")}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            Project
                            {getSortIcon("project_name")}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to sort by project</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                )}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTables.map((table) => (
                <TableRow 
                  key={table.id}
                  className="transition-colors hover:bg-muted/50 dark:hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:border-slate-700 font-normal text-xs">
                      {table.schema}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {table.rls_enabled ? (
                      <Badge className="bg-green-100 text-green-800 border-0 flex items-center w-fit hover:bg-green-100 hover:text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/30 dark:hover:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Enabled</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-0 flex items-center w-fit hover:bg-red-100 hover:text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/30 dark:hover:text-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        <span>Disabled</span>
                      </Badge>
                    )}
                  </TableCell>
                  {!isProjectView && (
                    <TableCell>
                      {table.project_name || "Unknown"}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {!table.rls_enabled && (
                      <Sheet open={isSheetOpen && selectedTableId === table.id} onOpenChange={(open) => {
                        setIsSheetOpen(open);
                        if (!open) setSelectedTableId(null);
                      }}>
                        <SheetTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-primary border-border hover:bg-muted/50 hover:text-primary-foreground"
                            onClick={() => setSelectedTableId(table.id)}
                            disabled={enablingRls.includes(table.id)}
                          >
                            {enablingRls.includes(table.id) ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Enabling...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                Enable RLS
                              </>
                            )}
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Enable Row Level Security</SheetTitle>
                            <SheetDescription>
                              You are about to enable Row Level Security for table <span className="font-medium">{table.name}</span>
                            </SheetDescription>
                          </SheetHeader>
                          <div className="py-4 space-y-4">
                            <div className="p-4 bg-amber-50 text-amber-800 rounded-md text-sm">
                              <p>Enabling RLS will restrict all access to this table until you create policies to grant access.</p>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">SQL that will be executed:</div>
                              <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-xs relative">
                                <pre>{`ALTER TABLE "${table.schema}"."${table.name}" ENABLE ROW LEVEL SECURITY;`}</pre>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-primary-foreground hover:bg-primary"
                                  onClick={() => copyToClipboard(`ALTER TABLE "${table.schema}"."${table.name}" ENABLE ROW LEVEL SECURITY;`)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <SheetFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsSheetOpen(false);
                                setSelectedTableId(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => handleEnableRls(table.id)}
                              disabled={enablingRls.includes(table.id)}
                            >
                              {enablingRls.includes(table.id) ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Enabling...
                                </>
                              ) : (
                                "Enable RLS"
                              )}
                            </Button>
                          </SheetFooter>
                        </SheetContent>
                      </Sheet>
                    )}
                    {table.rls_enabled && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="px-3 py-1 rounded-md bg-gray-100 text-gray-500 text-xs inline-flex items-center">
                              <Check className="h-3 w-3 mr-1 text-green-600" />
                              Secured
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">This table already has RLS enabled</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {sortedTables.length > itemsPerPage && (
          <div className="py-4 flex justify-between items-center px-6 border-t border-gray-100">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{endIndex} of {sortedTables.length} tables
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
        
        {/* Statistics at the bottom */}
        <div className="pt-2 pb-4 px-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-muted-foreground">{passedCount} Tables with RLS</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-muted-foreground">{failedCount} Tables without RLS</span>
            </div>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-muted-foreground">
                <Database className="h-3.5 w-3.5 mr-1" />
                View Raw Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Raw Table Data</DialogTitle>
              </DialogHeader>
              <div className="border rounded-md overflow-hidden">
                <pre className="p-4 text-xs overflow-auto max-h-[60vh] bg-gray-50">
                  {JSON.stringify(rawTables || tables, null, 2)}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

