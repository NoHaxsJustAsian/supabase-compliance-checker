"use client"

import { useEffect } from "react"
import { checkAndCreateTables } from "@/lib/db-checker"
import { UserMenu } from "@/components/UserMenu"
import { PATPopup } from "@/components/PATPopup"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Check if required tables exist
    const checkDb = async () => {
      await checkAndCreateTables();
    };
    
    checkDb();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Link href="/" className="hover:underline cursor-pointer">
              <span className="hidden sm:inline-block">Supabase Compliance Checker</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      
      {/* PAT Popup for first-time users */}
      <PATPopup />
    </div>
  )
} 