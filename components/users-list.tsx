"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, ShieldAlert, User, ArrowUpDown, ArrowUp, ArrowDown, Copy } from "lucide-react"
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
type SortField = "email" | "mfa_enabled" | "last_sign_in" | "project_name" | "project_id"
type SortDirection = "asc" | "desc" | null

interface User {
  id: string
  email: string
  mfa_enabled: boolean
  last_sign_in?: string
  project_id?: string
  project_name?: string
}

interface UsersListProps {
  users: User[]
  loading: boolean
  onFixUser: (userId: string) => void
  isProjectView?: boolean
  selectedProjectId?: string | null
}

export default function UsersList({ 
  users, 
  loading, 
  onFixUser, 
  isProjectView = false,
  selectedProjectId = null
}: UsersListProps) {
  // Add console logging to understand what data we're receiving
  useEffect(() => {
    console.log('UsersList received users:', users.length);
    if (users.length > 0) {
      console.log('First few users with project info:', users.slice(0, 3).map(u => ({
        email: u.email, 
        project_id: u.project_id,
        project_name: u.project_name
      })));
    }
  }, [users]);

  const [searchTerm, setSearchTerm] = useState("")
  const [fixingUsers, setFixingUsers] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  // Add sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  const handleFixUser = (userId: string) => {
    setFixingUsers((prev) => [...prev, userId])

    // Make sure we're passing the user ID to the callback
    onFixUser(userId);
    
    // Simulate fixing process with a delay before UI cleanup
    setTimeout(() => {
      setFixingUsers((prev) => prev.filter((id) => id !== userId))
      setIsSheetOpen(false); // Close the sheet after fixing
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

  // Filter users based on search term and selected project
  const filteredUsers = users
    .filter((user) => {
      // Filter by search term
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filter by project in project view mode
      const matchesProject = !isProjectView || !selectedProjectId || user.project_id === selectedProjectId
      
      return matchesSearch && matchesProject
    })

  // Apply sorting if active
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    if (sortField === "mfa_enabled") {
      // For boolean values
      if (sortDirection === "asc") {
        return a[sortField] === b[sortField] ? 0 : a[sortField] ? -1 : 1
      } else {
        return a[sortField] === b[sortField] ? 0 : a[sortField] ? 1 : -1
      }
    } else if (sortField === "last_sign_in") {
      // For date values
      const dateA = a[sortField] ? new Date(a[sortField]!).getTime() : 0
      const dateB = b[sortField] ? new Date(b[sortField]!).getTime() : 0
      
      if (sortDirection === "asc") {
        return dateA - dateB
      } else {
        return dateB - dateA
      }
    } else if (sortField === "project_name" || sortField === "project_id") {
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
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, sortedUsers.length)
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex)

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

  const passedCount = filteredUsers.filter((user) => user.mfa_enabled).length
  const failedCount = filteredUsers.length - passedCount

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-gray-800">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            Users & MFA Status
          </CardTitle>
          <CardDescription>Checking Multi-Factor Authentication status for all users</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Loading user data...</p>
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
          <CardTitle className="flex items-center text-gray-800">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            Users & MFA Status
          </CardTitle>
          <CardDescription>Select a project to view users</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <User className="h-8 w-8 text-gray-500" />
            <p className="text-sm text-gray-500">Please select a project to view MFA status for users.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-gray-800">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            Users & MFA Status
          </CardTitle>
          <CardDescription>No users found in selected project</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center space-y-4">
            <User className="h-8 w-8 text-gray-500" />
            <p className="text-sm text-gray-500">No users found. Please check your user authentication settings.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="border-b border-gray-100">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-gray-800">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            Users & MFA Status
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
        <CardDescription>
          Multi-Factor Authentication status for users
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-4">
        <div className="flex justify-between items-center px-6 mb-4">
          <div className="flex items-center gap-2">
            {/* Any additional filters would go here */}
          </div>

          <div className="relative w-64">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 border-gray-200 focus-visible:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead 
                  className="font-medium text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center">
                    Email
                    {getSortIcon("email")}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
                  onClick={() => handleSort("mfa_enabled")}
                >
                  <div className="flex items-center">
                    MFA Status
                    {getSortIcon("mfa_enabled")}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
                  onClick={() => handleSort("last_sign_in")}
                >
                  <div className="flex items-center">
                    Last Sign In
                    {getSortIcon("last_sign_in")}
                  </div>
                </TableHead>
                {!isProjectView && (
                  <TableHead
                    className="font-medium text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
                    onClick={() => handleSort("project_name")}
                  >
                    <div className="flex items-center">
                      Project
                      {getSortIcon("project_name")}
                    </div>
                  </TableHead>
                )}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow 
                  key={user.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.mfa_enabled ? (
                      <Badge className="bg-green-100 text-green-800 border-0 flex items-center w-fit hover:bg-green-100 hover:text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Enabled</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-0 flex items-center w-fit hover:bg-red-100 hover:text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        <span>Disabled</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in ? new Date(user.last_sign_in).toLocaleString() : 'Never'}
                  </TableCell>
                  {!isProjectView && (
                    <TableCell>
                      {user.project_name || "Unknown"}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {!user.mfa_enabled && (
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            disabled={fixingUsers.includes(user.id)}
                          >
                            {fixingUsers.includes(user.id) ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Enabling...
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="mr-1 h-3 w-3" />
                                Enable MFA
                              </>
                            )}
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Enable Multi-Factor Authentication</SheetTitle>
                            <SheetDescription>
                              You are about to enforce MFA for user <span className="font-medium">{user.email}</span>
                            </SheetDescription>
                          </SheetHeader>
                          <div className="py-4 space-y-4">
                            <div className="p-4 bg-amber-50 text-amber-800 rounded-md text-sm">
                              <p>Enabling MFA will require the user to set up an authenticator app or other second factor on their next login.</p>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">API endpoint that will be called:</div>
                              <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-xs relative">
                                <pre>{`POST /auth/v1/admin/users/${user.id}/mfa
{
  "enforce_mfa": true
}`}</pre>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-800"
                                  onClick={() => copyToClipboard(`POST /auth/v1/admin/users/${user.id}/mfa
{
  "enforce_mfa": true
}`)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <SheetFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => {}}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => handleFixUser(user.id)}
                              disabled={fixingUsers.includes(user.id)}
                            >
                              {fixingUsers.includes(user.id) ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Enabling...
                                </>
                              ) : (
                                "Enable MFA"
                              )}
                            </Button>
                          </SheetFooter>
                        </SheetContent>
                      </Sheet>
                    )}
                    {user.mfa_enabled && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="px-3 py-1 rounded-md bg-gray-100 text-gray-500 text-xs inline-flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                              Secured
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">This user already has MFA enabled</p>
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
        
        {sortedUsers.length > itemsPerPage && (
          <div className="py-4 flex justify-between items-center px-6 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{endIndex} of {sortedUsers.length} users
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
        
        {/* Statistics at the bottom */}
        <div className="pt-2 pb-4 px-6 flex justify-between items-center border-t border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">{passedCount} Users with MFA</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">{failedCount} Users without MFA</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

