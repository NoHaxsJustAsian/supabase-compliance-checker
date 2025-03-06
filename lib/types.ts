export type ProjectInfo = {
  id: string
  organization_id?: string
  name: string
  ref?: string
  region?: string
  created_at?: string
  status?: string
  database?: {
    host: string
    version: string
    postgres_engine: string
    release_channel: string
  }
}

export type ComplianceCheckResult = {
  status: "checking" | "passed" | "failed" | "error" | "inactive"
  details: any[]
  percentage: number
  rawTables?: any[]
}

export type ComplianceStatus = {
  mfa: ComplianceCheckResult
  rls: ComplianceCheckResult
  pitr: ComplianceCheckResult
}

export type ProjectComplianceMap = {
  [projectId: string]: ComplianceStatus
} 