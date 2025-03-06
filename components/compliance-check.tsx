import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"
import { ComplianceCheckResult } from "@/lib/types"

interface ComplianceCheckProps {
  title: string
  description: string
  status: ComplianceCheckResult["status"] | "inactive"
  progress: number
  details: string
  isProjectView?: boolean
  selectedProjectId?: string | null
  isInactive?: boolean
}

export default function ComplianceCheck({ 
  title, 
  description, 
  status, 
  progress, 
  details, 
  isProjectView = false,
  selectedProjectId = null,
  isInactive = false
}: ComplianceCheckProps) {
  
  // If in project view mode and no project is selected, show a placeholder
  if (isProjectView && !selectedProjectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-4">
            <p className="text-sm text-muted-foreground">Please select a project to view compliance status.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // If the project is inactive, show a message
  if (isInactive || status === "inactive") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              Inactive
            </Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-4">
            <p className="text-sm text-muted-foreground">This project is inactive. Please start the project to run compliance checks.</p>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">
              Project needs to be active
            </span>
          </div>
        </CardFooter>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {status === "checking" && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              Checking
            </Badge>
          )}
          {status === "passed" && (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Passed
            </Badge>
          )}
          {status === "failed" && (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              Failed
            </Badge>
          )}
          {status === "error" && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              Error
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{details}</p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center space-x-2">
          {status === "checking" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
          {status === "passed" && <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />}
          {status === "failed" && <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />}
          {status === "error" && <AlertTriangle className="h-5 w-5 text-orange-500" />}
          <span className="text-sm font-medium">
            {status === "checking" && "Running check..."}
            {status === "passed" && "All requirements met"}
            {status === "failed" && "Action required"}
            {status === "error" && "Check failed to run"}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

