import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ProjectsTable from "@/components/projects-table";
import { ProjectInfo, ProjectComplianceMap } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ProjectSelectorProps {
  projects: ProjectInfo[];
  complianceMap: ProjectComplianceMap;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onRunChecks: (projectId: string) => void;
  onFixIssues: (projectId: string) => void;
  runComplianceChecks: () => void;
  runningChecks: boolean;
}

export default function ProjectSelector({
  projects,
  complianceMap,
  selectedProjectId,
  onSelectProject,
  onRunChecks,
  onFixIssues,
  runComplianceChecks,
  runningChecks
}: ProjectSelectorProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>View and manage compliance for all your Supabase projects</CardDescription>
          </div>
          <Button variant="outline" onClick={() => runComplianceChecks()} disabled={runningChecks}>
            <RefreshCw className={`mr-2 h-4 w-4 ${runningChecks ? "animate-spin" : ""}`} />
            {runningChecks ? "Running Checks..." : "Run All Checks"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ProjectsTable 
          projects={projects}
          complianceMap={complianceMap}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
          onRunChecks={onRunChecks}
          onFixIssues={onFixIssues}
        />
      </CardContent>
    </Card>
  );
} 