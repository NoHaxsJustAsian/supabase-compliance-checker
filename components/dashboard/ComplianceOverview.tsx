import ComplianceCheck from "@/components/compliance-check";
import ComplianceInsights from "@/components/compliance-insights";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ComplianceStatus } from "@/lib/types";

interface ComplianceOverviewProps {
  statusData: ComplianceStatus;
  viewMode: "overview" | "project";
  selectedProjectId: string | null;
  handleProjectChange?: (projectId: string) => void;
  setViewMode?: (mode: "overview" | "project") => void;
  runningChecks?: boolean;
}

export default function ComplianceOverview({
  statusData,
  viewMode,
  selectedProjectId,
  handleProjectChange,
  setViewMode,
  runningChecks = false
}: ComplianceOverviewProps) {
  const isInactive = statusData?.mfa?.status === "inactive" || 
                    statusData?.rls?.status === "inactive" || 
                    statusData?.pitr?.status === "inactive";

  return (
    <div className="space-y-4 relative z-40">
      <div className="grid gap-4 md:grid-cols-3">
        <ComplianceCheck
          title="Multi-Factor Authentication"
          description="Check if MFA is enabled for all users"
          status={runningChecks ? "checking" : statusData?.mfa?.status || "checking"}
          progress={statusData?.mfa?.percentage || 0}
          details={`${(statusData?.mfa?.details || []).filter((u) => u?.mfa_enabled).length}/${(statusData?.mfa?.details || []).length} users have MFA enabled`}
          isProjectView={viewMode === "project"}
          selectedProjectId={selectedProjectId}
          isInactive={isInactive}
        />

        <ComplianceCheck
          title="Row Level Security"
          description="Verify RLS is enabled for all tables"
          status={runningChecks ? "checking" : statusData?.rls?.status || "checking"}
          progress={statusData?.rls?.percentage || 0}
          details={`${(statusData?.rls?.details || []).filter((t) => t?.rls_enabled).length}/${(statusData?.rls?.details || []).length} tables have RLS enabled`}
          isProjectView={viewMode === "project"}
          selectedProjectId={selectedProjectId}
          isInactive={isInactive}
        />

        <ComplianceCheck
          title="Point in Time Recovery"
          description="Check if PITR is enabled for projects"
          status={runningChecks ? "checking" : statusData?.pitr?.status || "checking"}
          progress={statusData?.pitr?.percentage || 0}
          details={`${(statusData?.pitr?.details || []).filter((p) => p?.pitr_enabled).length}/${(statusData?.pitr?.details || []).length} projects have PITR enabled`}
          isProjectView={viewMode === "project"}
          selectedProjectId={selectedProjectId}
          isInactive={isInactive}
        />
      </div>

      <ComplianceInsights 
        mfaStatus={statusData?.mfa}
        rlsStatus={statusData?.rls}
        pitrStatus={statusData?.pitr}
        isInactive={isInactive}
      />

      {viewMode === "overview" && !runningChecks && statusData?.mfa?.status !== "passed" && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Risk</AlertTitle>
          <AlertDescription>
            {statusData?.mfa?.status === "failed" && "Some users don't have Multi-Factor Authentication enabled. This is a critical security risk."}
            {statusData?.mfa?.status === "checking" && "Checking Multi-Factor Authentication status..."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 