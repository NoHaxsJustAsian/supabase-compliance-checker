import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LightbulbIcon, AlertTriangle, InfoIcon, CheckCircle, Copy, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
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

interface ComplianceInsightsProps {
  mfaStatus: any
  rlsStatus: any
  pitrStatus: any
  isInactive?: boolean
}

export default function ComplianceInsights({
  mfaStatus,
  rlsStatus,
  pitrStatus,
  isInactive = false
}: ComplianceInsightsProps) {
  const { toast } = useToast()
  const [activeSheet, setActiveSheet] = useState<"mfa" | "rls" | "pitr" | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "You can now paste the SQL code in your query editor",
    })
  }

  const applyFix = (fixType: "mfa" | "rls" | "pitr") => {
    // Here you would implement the actual fix application logic
    toast({
      title: "Fix applied",
      description: `${fixType.toUpperCase()} compliance issue has been fixed`,
    })
    // Close the sheet after applying
    setActiveSheet(null)
  }

  if (isInactive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Compliance Insights
          </CardTitle>
          <CardDescription>Recommendations to improve your compliance posture</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Project Inactive</AlertTitle>
            <AlertDescription>
              Start your project to receive compliance insights and recommendations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Compliance Insights
        </CardTitle>
        <CardDescription>Recommendations to improve your compliance posture</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MFA Recommendations */}
        {mfaStatus?.status === "failed" && (
          <Alert className="bg-amber-50 border-amber-200">
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                  <h4 className="text-amber-800 font-medium">Multi-Factor Authentication Required</h4>
                </div>
                
                <Sheet open={activeSheet === "mfa"} onOpenChange={(open) => setActiveSheet(open ? "mfa" : null)}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Wrench className="h-3.5 w-3.5 mr-1" />
                      Fix Now
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                        <SheetTitle>Fix MFA Configuration</SheetTitle>
                      </div>
                      <SheetDescription>
                        Apply the following configurations to enable Multi-Factor Authentication for all users.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="my-6 space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-2">1. Enable MFA for all users</h4>
                        <div className="bg-slate-900 text-slate-50 p-3 rounded-md text-xs font-mono relative mb-2">
                          <pre>
                            {`-- Create policy "Enforce MFA for all end users."
on auth.users
as restrictive
to authenticated
using ( (auth.jwt()->>'aal') = 'aal2' );`}
                          </pre>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-slate-50 bg-slate-800/50"
                            onClick={() => copyToClipboard(`-- Create policy "Enforce MFA for all end users."
on auth.users
as restrictive
to authenticated
using ( (auth.jwt()->>'aal') = 'aal2' );`)}
                          >
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copy</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">2. Configure auth settings</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Make sure your client applications enforce MFA for authenticated routes.
                        </p>
                      </div>
                    </div>
                    
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </SheetClose>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => applyFix("mfa")}>Apply Fix</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
              
              <AlertDescription className="text-amber-700">
                <p className="mb-2">
                  Not all your users have MFA enabled. Implement a policy to enforce MFA for all authenticated users:
                </p>
                <div className="bg-slate-900 text-slate-50 p-3 rounded-md text-xs font-mono relative mb-2">
                  <pre>
                    {`-- Create policy "Enforce MFA for all end users."
on auth.users
as restrictive
to authenticated
using ( (auth.jwt()->>'aal') = 'aal2' );`}
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-slate-50 bg-slate-800/50"
                    onClick={() => copyToClipboard(`-- Create policy "Enforce MFA for all end users."
on auth.users
as restrictive
to authenticated
using ( (auth.jwt()->>'aal') = 'aal2' );`)}
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
                <p className="text-xs">This policy will restrict access to authenticated users unless they have completed MFA.</p>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* RLS Recommendations */}
        {rlsStatus?.status === "failed" && (
          <Alert className="bg-amber-50 border-amber-200">
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                  <h4 className="text-amber-800 font-medium">Row Level Security Missing</h4>
                </div>
                
                <Sheet open={activeSheet === "rls"} onOpenChange={(open) => setActiveSheet(open ? "rls" : null)}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Wrench className="h-3.5 w-3.5 mr-1" />
                      Fix Now
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                        <SheetTitle>Fix Row Level Security</SheetTitle>
                      </div>
                      <SheetDescription>
                        Apply the following configurations to enable Row Level Security for your tables.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="my-6 space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-2">1. Enable RLS on all tables</h4>
                        <div className="bg-slate-900 text-slate-50 p-3 rounded-md text-xs font-mono relative mb-2">
                          <pre>
                            {`-- Enable RLS on a table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create a basic policy
CREATE POLICY "Users can only view their own data"
ON table_name
FOR ALL
USING (auth.uid() = user_id);`}
                          </pre>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-slate-50 bg-slate-800/50"
                            onClick={() => copyToClipboard(`-- Enable RLS on a table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create a basic policy
CREATE POLICY "Users can only view their own data"
ON table_name
FOR ALL
USING (auth.uid() = user_id);`)}
                          >
                            <Copy className="h-3 w-3" />
                            <span className="sr-only">Copy</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">2. Create appropriate RLS policies</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Customize the RLS policies based on your application's data access requirements.
                        </p>
                      </div>
                    </div>
                    
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </SheetClose>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => applyFix("rls")}>Apply Fix</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
              
              <AlertDescription className="text-amber-700">
                <p className="mb-2">
                  Some of your tables don't have Row Level Security enabled. Implement RLS on all tables:
                </p>
                <div className="bg-slate-900 text-slate-50 p-3 rounded-md text-xs font-mono relative mb-2">
                  <pre>
                    {`-- Enable RLS on a table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create a basic policy
CREATE POLICY "Users can only view their own data"
ON table_name
FOR ALL
USING (auth.uid() = user_id);`}
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-slate-50 bg-slate-800/50"
                    onClick={() => copyToClipboard(`-- Enable RLS on a table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create a basic policy
CREATE POLICY "Users can only view their own data"
ON table_name
FOR ALL
USING (auth.uid() = user_id);`)}
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
                <p className="text-xs">Replace table_name with your actual table name and user_id with the column that stores the user ID.</p>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* PITR Recommendations */}
        {pitrStatus?.status === "failed" && (
          <Alert className="bg-amber-50 border-amber-200">
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                  <h4 className="text-amber-800 font-medium">Point-in-Time Recovery Not Enabled</h4>
                </div>
                
                <Sheet open={activeSheet === "pitr"} onOpenChange={(open) => setActiveSheet(open ? "pitr" : null)}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Wrench className="h-3.5 w-3.5 mr-1" />
                      Fix Now
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                        <SheetTitle>Enable Point-in-Time Recovery</SheetTitle>
                      </div>
                      <SheetDescription>
                        Follow these steps to enable Point-in-Time Recovery for your project.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="my-6 space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-2">1. Navigate to Project Settings</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Go to the project settings in your Supabase dashboard.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">2. Enable PITR</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Find the Point-in-Time Recovery option and enable it.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">3. Set Retention Period</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Choose an appropriate retention period based on your compliance requirements.
                        </p>
                      </div>
                    </div>
                    
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </SheetClose>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => applyFix("pitr")}>Apply Fix</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
              
              <AlertDescription className="text-amber-700">
                <p className="mb-2">
                  Point-in-Time Recovery is not enabled for all projects. Enable PITR in your project settings for data recovery capability.
                </p>
                <p className="text-xs">PITR allows you to restore your database to any point in time within the retention period, protecting against accidental data loss.</p>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* All checks passed */}
        {mfaStatus?.status === "passed" && rlsStatus?.status === "passed" && pitrStatus?.status === "passed" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">All Compliance Checks Passed</AlertTitle>
            <AlertDescription className="text-green-700">
              Great job! Your project meets all the compliance requirements. Continue to monitor for any changes.
            </AlertDescription>
          </Alert>
        )}

        {/* Checks still running */}
        {(mfaStatus?.status === "checking" || rlsStatus?.status === "checking" || pitrStatus?.status === "checking") && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Checks in Progress</AlertTitle>
            <AlertDescription>
              Some compliance checks are still running. Insights will be available once all checks are complete.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}