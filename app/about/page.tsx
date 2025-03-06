import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <ShieldAlert className="h-6 w-6" />
              <span className="font-bold">Supabase Compliance Checker</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/auth" className="text-sm font-medium">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">About Supabase Compliance Checker</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our tool helps you ensure your Supabase configuration follows security best practices and compliance
                  requirements.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Why Compliance Matters</h2>
                  <p className="text-muted-foreground">
                    Supabase provides powerful tools, but with great power comes great responsibility. Ensuring your
                    configuration follows security best practices is essential for protecting your data and maintaining
                    compliance with regulations. [^5]
                  </p>
                </div>
                <ul className="grid gap-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Protect sensitive user data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Prevent unauthorized access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Ensure business continuity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Meet regulatory requirements</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Shared Responsibility Model</CardTitle>
                    <CardDescription>Understanding your responsibilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Running databases is a shared responsibility between you and Supabase. There are some things that
                      Supabase can take care of for you, and some things that you are responsible for. [^1]
                    </p>
                    <p className="mt-2 text-muted-foreground">You are always responsible for:</p>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>Your Supabase account</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>Access management</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>Data</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>Applying security controls</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <CardTitle>Multi-Factor Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    MFA adds an extra layer of security by requiring users to provide two or more verification factors
                    to gain access. This significantly reduces the risk of unauthorized access even if passwords are
                    compromised. [^3]
                  </p>
                  <div className="mt-4">
                    <Link href="/auth">
                      <Button variant="outline" size="sm">
                        Check MFA Status
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Row Level Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    RLS allows you to control which users can access which rows in a database table. This is essential
                    for applications where users should only see their own data or data that has been specifically
                    shared with them. [^2]
                  </p>
                  <div className="mt-4">
                    <Link href="/auth">
                      <Button variant="outline" size="sm">
                        Check RLS Status
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Point in Time Recovery</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    PITR allows you to restore your database to any point in time within a retention period. This is
                    crucial for disaster recovery and protecting against data corruption or accidental deletion. [^4]
                  </p>
                  <div className="mt-4">
                    <Link href="/auth">
                      <Button variant="outline" size="sm">
                        Check PITR Status
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 Supabase Compliance Checker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

