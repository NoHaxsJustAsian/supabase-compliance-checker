"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface DownloadLogsProps {
  logs: any[]
}

export function DownloadLogs({ logs }: DownloadLogsProps) {
  const { user } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Only show download button if there are logs and user is not logged in
  if (logs.length === 0 || user) {
    return null
  }
  
  const handleDownload = () => {
    setIsDownloading(true)
    try {
      // Convert logs to CSV
      const headers = ["timestamp", "check", "project", "projectId", "status", "details"]
      const csvContent = [
        // Headers
        headers.join(","),
        // Data rows
        ...logs.map(log => {
          return headers.map(header => {
            // Handle special cases and escape commas
            const value = log[header] || ""
            const stringValue = String(value)
            // If the value contains a comma, quote it
            return stringValue.includes(",") ? `"${stringValue}"` : stringValue
          }).join(",")
        })
      ].join("\n")
      
      // Create a download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `compliance-logs-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading logs:", error)
    } finally {
      setIsDownloading(false)
    }
  }
  
  return (
    <div className="flex flex-col items-center mt-4 mb-2">
      <p className="text-sm text-muted-foreground mb-2">
        You're using API-only access. Your logs will be lost when you close the browser.
      </p>
      <Button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        {isDownloading ? "Generating CSV..." : "Download Logs as CSV"}
      </Button>
    </div>
  )
} 