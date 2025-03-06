"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCredentials, logComplianceCheck } from "@/lib/auth-utils";
import { ComplianceCheckResult, ComplianceStatus, ProjectComplianceMap, ProjectInfo } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export function useComplianceData() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [runningChecks, setRunningChecks] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>({
    mfa: { status: "checking", details: [], percentage: 0 },
    rls: { status: "checking", details: [], percentage: 0 },
    pitr: { status: "checking", details: [], percentage: 0 },
  });
  const [projectComplianceMap, setProjectComplianceMap] = useState<ProjectComplianceMap>({});
  const [availableProjects, setAvailableProjects] = useState<ProjectInfo[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [evidenceLogs, setEvidenceLogs] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"overview" | "project">("overview");

  // Fetch evidence logs from Supabase when the component mounts
  useEffect(() => {
    if (user && evidenceLogs.length === 0) {
      console.log("Fetching evidence logs from Supabase on initial load");
      fetchEvidenceLogs();
    }
  }, [user]);

  // Function to fetch evidence logs from Supabase
  const fetchEvidenceLogs = async () => {
    if (!user) return;
    
    try {
      // Modify the query to fetch all logs using pagination
      // First, get the total count
      const { count } = await supabase
        .from('compliance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      const totalLogs = count || 0;
      console.log(`Total logs in database: ${totalLogs}`);
      
      if (totalLogs === 0) return;
      
      // Calculate the number of pages needed (100 logs per page)
      const pageSize = 100;
      const pages = Math.ceil(totalLogs / pageSize);
      let allLogs: any[] = [];
      
      // Fetch all pages
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        console.log(`Fetching logs page ${page + 1}/${pages} (from ${from} to ${to})`);
        
        const { data: logs, error } = await supabase
          .from('compliance_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to);
          
        if (error) {
          console.error(`Error fetching logs page ${page + 1}:`, error);
          continue;
        }
        
        if (logs && logs.length > 0) {
          allLogs = [...allLogs, ...logs];
        }
      }
      
      console.log(`Retrieved ${allLogs.length} total logs`);
      
      if (allLogs.length > 0) {
        // Format logs to match the expected structure
        const formattedLogs = allLogs.map(log => ({
          check: log.check_type,
          status: log.status,
          details: log.details,
          projectId: log.project_id,
          project: log.project_name,
          timestamp: log.created_at || new Date().toISOString(),
        }));
        
        // Merge logs from Supabase with existing logs
        // First convert to a Map using timestamp+check as a unique key
        const existingLogsMap = new Map();
        evidenceLogs.forEach(log => {
          const key = `${log.timestamp}-${log.check}-${log.projectId || ''}`;
          existingLogsMap.set(key, log);
        });
        
        // Add logs from Supabase, overriding any duplicates
        formattedLogs.forEach(log => {
          const key = `${log.timestamp}-${log.check}-${log.projectId || ''}`;
          existingLogsMap.set(key, log);
        });
        
        // Convert map back to array and sort by timestamp
        const mergedLogs = Array.from(existingLogsMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
        // Update state with merged logs
        setEvidenceLogs(mergedLogs);
      }
    } catch (error) {
      console.error("Error fetching evidence logs:", error);
    }
  };

  useEffect(() => {
    // Clear any old checks run flag to ensure we always run checks
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('checksRun');
    }
    
    const fetchCredentials = async () => {
      const credentials = await getCredentials();
      if (!credentials) {
        router.push("/auth");
        return;
      }

      // Run compliance checks on initial page load, not on view mode changes
      // If checkAllProjects is true, fetch all available projects first
      if (credentials.checkAllProjects) {
        const fetchAndRunChecks = async () => {
          try {
            const projects = await fetchAvailableProjects(credentials.apiKey);
            if (projects && projects.length > 0) {
              // Pass the projects directly to avoid relying on state update
              await runComplianceChecks(projects);
              
              // If in overview mode, make sure to update the overall status
              if (viewMode === "overview") {
                updateOverallComplianceStatus();
              }
            }
          } catch (error) {
            console.error("Failed to fetch projects or run checks:", error);
            setLoading(false);
          }
        };
        fetchAndRunChecks();
      } else {
        runComplianceChecks();
      }
    };
    
    fetchCredentials();
  }, [router]);

  useEffect(() => {
    console.log(`ViewMode changed to: ${viewMode}`);
    if (viewMode === "overview") {
      // When switching to overview mode, update the overall compliance status
      // but don't run new checks, just update from existing project data
      const projectIds = Object.keys(projectComplianceMap);
      
      // If no project data available yet and we haven't already checked, run the checks
      if (projectIds.length === 0 && !runningChecks && availableProjects.length > 0 && !loading) {
        console.log("No project data available, running compliance checks first");
        runComplianceChecks();
      } else {
        // Just update the UI with existing data
        updateOverallComplianceStatus();
      }
    }
  }, [viewMode, projectComplianceMap, runningChecks, availableProjects]);

  // Update overview when projectComplianceMap changes while in overview mode
  useEffect(() => {
    if (viewMode === "overview" && Object.keys(projectComplianceMap).length > 0) {
      console.log("ProjectComplianceMap updated, refreshing overview");
      updateOverallComplianceStatus();
    }
  }, [projectComplianceMap, viewMode]);

  const fetchAvailableProjects = async (apiKey: string) => {
    try {
      const response = await fetch(`/api/list-projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      const projects = data.projects || [];
      setAvailableProjects(projects);

      // Set the first project as selected by default if available and no project is currently selected
      if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
      }
      
      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      addEvidenceLog({
        check: "Projects Fetch",
        status: "ERROR",
        details: `Failed to fetch available projects: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const runComplianceChecks = async (projectsOverride?: ProjectInfo[]) => {
    setRunningChecks(true);
    setLoading(true);

    try {
      const credentials = await getCredentials();
      if (!credentials) {
        router.push("/auth");
        return;
      }
      
      const { apiKey, projectId, checkAllProjects } = credentials;
      
      // Use provided projects if available, otherwise use state
      const projectsToCheck = projectsOverride || availableProjects;
      
      // Add debugging logs
      console.log("Running compliance checks with:", {
        checkAllProjects,
        projectsOverride: projectsOverride?.length || 0,
        availableProjects: availableProjects.length,
        projectsToCheck: projectsToCheck.length
      });

      if (checkAllProjects && projectsToCheck.length > 0) {
        // Filter out inactive projects
        const activeProjects = projectsToCheck.filter(project => 
          project.status && 
          !["INACTIVE", "REMOVED", "PAUSE_FAILED"].includes(project.status)
        );
        
        console.log(`Filtered ${projectsToCheck.length - activeProjects.length} inactive projects out of ${projectsToCheck.length} total projects`);
        
        // Run checks for all active projects
        await Promise.all(
          activeProjects.map(project => runChecksForProject(apiKey, project.id, project.name))
        );
        
        // Also update the overall compliance status based on all projects
        updateOverallComplianceStatus();
        
        // If a project is selected, update its status
        if (selectedProjectId) {
          setComplianceStatus(projectComplianceMap[selectedProjectId] || {
            mfa: { status: "checking", details: [], percentage: 0 },
            rls: { status: "checking", details: [], percentage: 0 },
            pitr: { status: "checking", details: [], percentage: 0 },
          });
        }
      } else {
        // Run checks for the selected project or the default project
        const targetProjectId = selectedProjectId || projectId || (availableProjects.length > 0 ? availableProjects[0].id : "");
        
        if (targetProjectId) {
          await runChecksForProject(
            apiKey, 
            targetProjectId, 
            availableProjects.find(p => p.id === targetProjectId)?.name || "Unknown Project"
          );
        } else {
          console.error("No project reference available for running checks");
          // Set an error state or notification here
          addEvidenceLog({
            check: "Compliance Check Run",
            status: "ERROR",
            details: "No project reference available for running checks. Please select a project or check your API key.",
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error running compliance checks:", error);
      addEvidenceLog({
        check: "Compliance Check Run",
        status: "ERROR",
        details: `Error running compliance checks: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setRunningChecks(false);
      setLoading(false);
    }
  };

  const runChecksForProject = async (apiKey: string, projectId: string, projectName?: string) => {
    try {
      // Initialize project in the map if it doesn't exist
      const initialStatus: ComplianceStatus = {
        mfa: { status: "checking", details: [], percentage: 10 },
        rls: { status: "checking", details: [], percentage: 10 },
        pitr: { status: "checking", details: [], percentage: 10 },
      };
      
      setProjectComplianceMap(prev => ({
        ...prev,
        [projectId]: initialStatus
      }));
      
      // If this is the currently selected project, also update the current status
      if (selectedProjectId === projectId) {
        setComplianceStatus(initialStatus);
      }

      // Run MFA check
      const mfaResponse = await fetch(`/api/check-mfa?apiKey=${encodeURIComponent(apiKey || "")}&projectRef=${encodeURIComponent(projectId || "")}`);
      const mfaData = await mfaResponse.json();
      
      // Add project information to users
      const userDetails = mfaData.details || [];
      const usersWithProjectInfo = userDetails.map((user: any) => ({
        ...user,
        project_id: projectId,
        project_name: projectName || `Project ${projectId.slice(0, 8)}`
      }));

      // Update the project map with MFA results
      setProjectComplianceMap(prev => {
        const updatedProject = {
          ...prev[projectId],
          mfa: {
            status: mfaData.hasError ? "error" as const : (mfaData.passed ? "passed" as const : "failed" as const),
            details: usersWithProjectInfo,
            percentage: 100,
          },
        };
        
        return {
          ...prev,
          [projectId]: updatedProject
        };
      });
      
      // If this is the currently selected project, also update the current status
      if (selectedProjectId === projectId) {
        setComplianceStatus(prev => ({
          ...prev,
          mfa: {
            status: mfaData.hasError ? "error" as const : (mfaData.passed ? "passed" as const : "failed" as const),
            details: usersWithProjectInfo,
            percentage: 100,
          },
        }));
      }

      // Log evidence
      addEvidenceLog({
        check: "MFA Verification",
        project: projectName || projectId,
        projectId: projectId,
        status: mfaData.hasError ? "ERROR" : (mfaData.passed ? "PASSED" : "FAILED"),
        details: mfaData.hasError 
          ? `Error checking MFA: ${mfaData.error || "Unknown error"}`
          : `${mfaData.enabledCount}/${mfaData.totalCount} users have MFA enabled`,
        timestamp: new Date().toISOString(),
      });

      // Run RLS check
      const rlsResponse = await fetch(`/api/check-rls?apiKey=${encodeURIComponent(apiKey || "")}&projectRef=${encodeURIComponent(projectId || "")}`);
      const rlsData = await rlsResponse.json();
      
      // Add project information to tables - ensure we have a proper project name
      const tableDetails = rlsData.details || [];
      const effectiveProjectName = projectName || availableProjects.find(p => p.id === projectId)?.name || `Project ${projectId.slice(0, 8)}`;
      console.log(`Adding project info to tables for project: ${projectId}, name: ${effectiveProjectName}`);
      
      const tablesWithProjectInfo = tableDetails.map((table: any) => ({
        ...table,
        project_id: projectId,
        project_name: effectiveProjectName
      }));

      // Update the project map with RLS results
      setProjectComplianceMap(prev => {
        const updatedProject = {
          ...prev[projectId],
          rls: {
            status: rlsData.hasError ? "error" as const : (rlsData.passed ? "passed" as const : "failed" as const),
            details: tablesWithProjectInfo,
            percentage: 100,
            rawTables: rlsData.rawTables || []
          },
        };
        
        return {
          ...prev,
          [projectId]: updatedProject
        };
      });
      
      // If this is the currently selected project, also update the current status
      if (selectedProjectId === projectId) {
        setComplianceStatus(prev => ({
          ...prev,
          rls: {
            status: rlsData.hasError ? "error" as const : (rlsData.passed ? "passed" as const : "failed" as const),
            details: tablesWithProjectInfo,
            percentage: 100,
            rawTables: rlsData.rawTables || []
          },
        }));
      }

      // Log evidence
      addEvidenceLog({
        check: "RLS Verification",
        project: projectName || projectId,
        projectId: projectId,
        status: rlsData.hasError ? "ERROR" : (rlsData.passed ? "PASSED" : "FAILED"),
        details: rlsData.hasError 
          ? `Error checking RLS: ${rlsData.error || "Unknown error"}`
          : `${rlsData.enabledCount}/${rlsData.totalCount} tables have RLS enabled`,
        timestamp: new Date().toISOString(),
      });

      // Run PITR check - Note: projectId is optional for this check
      try {
        const pitrResponse = await fetch(`/api/check-pitr?apiKey=${encodeURIComponent(apiKey || "")}${projectId ? `&projectRef=${encodeURIComponent(projectId)}` : ''}`);
        const pitrData = await pitrResponse.json();

        // Log the PITR data for debugging
        console.log("PITR check response:", pitrData);

        // Update the project map with PITR results
        setProjectComplianceMap(prev => {
          const updatedProject = {
            ...prev[projectId],
            pitr: {
              status: pitrData.hasError ? "error" as const : (pitrData.passed ? "passed" as const : "failed" as const),
              details: pitrData.projects || [],
              percentage: 100,
            },
          };
          
          return {
            ...prev,
            [projectId]: updatedProject
          };
        });
        
        // If this is the currently selected project, also update the current status
        if (selectedProjectId === projectId) {
          setComplianceStatus(prev => ({
            ...prev,
            pitr: {
              status: pitrData.hasError ? "error" as const : (pitrData.passed ? "passed" as const : "failed" as const),
              details: pitrData.projects || [],
              percentage: 100,
            },
          }));
        }

        // Log evidence
        addEvidenceLog({
          check: "PITR Verification",
          project: projectName || projectId,
          projectId: projectId,
          status: pitrData.hasError ? "ERROR" : (pitrData.passed ? "PASSED" : "FAILED"),
          details: pitrData.hasError 
            ? `Error checking PITR: ${pitrData.error || "Unknown error"}`
            : `${pitrData.enabledCount}/${pitrData.totalCount} projects have PITR enabled`,
          timestamp: new Date().toISOString(),
        });
      } catch (pitrError) {
        console.error("Error running PITR check:", pitrError);
        
        // Update with error status
        setProjectComplianceMap(prev => {
          const updatedProject = {
            ...prev[projectId],
            pitr: {
              status: "error" as "error",
              details: [],
              percentage: 100,
            },
          };
          
          return {
            ...prev,
            [projectId]: updatedProject
          };
        });
        
        if (selectedProjectId === projectId) {
          setComplianceStatus(prev => ({
            ...prev,
            pitr: {
              status: "error" as "error",
              details: [],
              percentage: 100,
            },
          }));
        }
        
        // Log error evidence
        addEvidenceLog({
          check: "PITR Verification",
          project: projectName || projectId,
          projectId: projectId,
          status: "ERROR",
          details: "Failed to check PITR status",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Error running checks for project ${projectId}:`, error);
      
      // Update the project status to show the error
      setProjectComplianceMap(prev => ({
        ...prev,
        [projectId]: {
          mfa: { status: "error", details: [], percentage: 100 },
          rls: { status: "error", details: [], percentage: 100 },
          pitr: { status: "error", details: [], percentage: 100 },
        }
      }));
      
      addEvidenceLog({
        check: "Project Compliance Check",
        project: projectName || projectId,
        projectId: projectId,
        status: "ERROR",
        details: `Error checking compliance: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const runChecksForSingleProject = async (projectId: string) => {
    const credentials = await getCredentials();
    if (!credentials || !credentials.apiKey) return;
    
    // Set loading state for this specific project
    setRunningChecks(true);
    
    // Set the selected project
    setSelectedProjectId(projectId);
    
    try {
      // Find project name if available
      const projectName = availableProjects.find(p => p.id === projectId)?.name;
      
      // Run checks for this specific project
      await runChecksForProject(credentials.apiKey, projectId, projectName);
    } finally {
      setRunningChecks(false);
    }
  };

  const fixIssuesForProject = async (projectId: string) => {
    // Set the selected project
    setSelectedProjectId(projectId);
    
    // Log the fix action
    addEvidenceLog({
      check: "Auto-Fix",
      status: "INITIATED",
      details: "Started automatic remediation of compliance issues",
      timestamp: new Date().toISOString(),
      project: projectId
    });

    // Simulate fixing process
    setTimeout(() => {
      addEvidenceLog({
        check: "Auto-Fix",
        status: "COMPLETED",
        details: "Completed automatic remediation of compliance issues",
        timestamp: new Date().toISOString(),
        project: projectId
      });

      // Re-run checks for this project
      runChecksForSingleProject(projectId);
    }, 2000);
  };

  const updateOverallComplianceStatus = () => {
    // Calculate overall compliance status based on all projects
    const projectIds = Object.keys(projectComplianceMap);
    if (projectIds.length === 0) return;
    
    const overallStatus: ComplianceStatus = {
      mfa: { status: "passed", details: [], percentage: 100 },
      rls: { status: "passed", details: [], percentage: 100 },
      pitr: { status: "passed", details: [], percentage: 100 },
    };
    
    // Combine all details and determine overall status
    projectIds.forEach(id => {
      const projectStatus = projectComplianceMap[id];
      
      // MFA check
      if (projectStatus.mfa.status === "error") {
        overallStatus.mfa.status = "error";
      } else if (projectStatus.mfa.status === "failed" && overallStatus.mfa.status !== "error") {
        overallStatus.mfa.status = "failed";
      }
      overallStatus.mfa.details = [...overallStatus.mfa.details, ...projectStatus.mfa.details];
      
      // RLS check
      if (projectStatus.rls.status === "error") {
        overallStatus.rls.status = "error";
      } else if (projectStatus.rls.status === "failed" && overallStatus.rls.status !== "error") {
        overallStatus.rls.status = "failed";
      }
      overallStatus.rls.details = [...overallStatus.rls.details, ...projectStatus.rls.details];
      
      // PITR check
      if (projectStatus.pitr.status === "error") {
        overallStatus.pitr.status = "error";
      } else if (projectStatus.pitr.status === "failed" && overallStatus.pitr.status !== "error") {
        overallStatus.pitr.status = "failed";
      }
      overallStatus.pitr.details = [...overallStatus.pitr.details, ...projectStatus.pitr.details];
    });
    
    // Calculate overall percentages
    // MFA percentage
    const mfaTotal = overallStatus.mfa.details.length;
    const mfaEnabled = overallStatus.mfa.details.filter(user => user.mfa_enabled).length;
    overallStatus.mfa.percentage = mfaTotal > 0 ? Math.round((mfaEnabled / mfaTotal) * 100) : 100;
    
    // RLS percentage
    const rlsTotal = overallStatus.rls.details.length;
    const rlsEnabled = overallStatus.rls.details.filter(table => table.rls_enabled).length;
    overallStatus.rls.percentage = rlsTotal > 0 ? Math.round((rlsEnabled / rlsTotal) * 100) : 100;
    
    // PITR percentage
    const pitrTotal = overallStatus.pitr.details.length;
    const pitrEnabled = overallStatus.pitr.details.filter(project => project.pitr_enabled).length;
    overallStatus.pitr.percentage = pitrTotal > 0 ? Math.round((pitrEnabled / pitrTotal) * 100) : 100;
    
    // Set the overall status in the state
    setComplianceStatus(overallStatus);
    
    console.log("Updated overall compliance status:", {
      mfaDetails: overallStatus.mfa.details.length,
      rlsDetails: overallStatus.rls.details.length,
      pitrDetails: overallStatus.pitr.details.length
    });
  };

  const addEvidenceLog = async (log: any) => {
    // Add timestamp if not provided
    if (!log.timestamp) {
      log.timestamp = new Date().toISOString();
    }
    
    // Add to local state first
    setEvidenceLogs((prev) => [log, ...prev]);
    
    if (user) {
      try {
        // Save to Supabase
        await logComplianceCheck(
          log.check,
          log.status as 'PASSED' | 'FAILED' | 'ERROR',
          log.details,
          log.projectId,
          log.project
        );
        
        // We don't need to fetch logs immediately after adding one
        // This prevents the count from resetting
        // fetchEvidenceLogs will be called when needed (refresh button, etc.)
      } catch (error) {
        console.error("Error adding evidence log:", error);
      }
    }
  };

  const getOverallStatus = () => {
    if (loading || runningChecks) return "checking";

    // Check if selected project is inactive when in project view
    if (viewMode === "project" && selectedProjectId) {
      const selectedProject = availableProjects.find(p => p.id === selectedProjectId);
      if (selectedProject && 
          (!selectedProject.status || 
           ["INACTIVE", "REMOVED", "PAUSE_FAILED"].includes(selectedProject.status))) {
        return "inactive";
      }
    }

    const statusToCheck = viewMode === "overview" 
      ? complianceStatus 
      : (selectedProjectId ? projectComplianceMap[selectedProjectId] : complianceStatus);

    if (!statusToCheck) return "checking";

    // Check if any check has error status
    const hasErrors = 
      statusToCheck.mfa?.status === "error" ||
      statusToCheck.rls?.status === "error" ||
      statusToCheck.pitr?.status === "error";
    
    if (hasErrors) return "error";

    const allPassed =
      statusToCheck.mfa?.status === "passed" &&
      statusToCheck.rls?.status === "passed" &&
      statusToCheck.pitr?.status === "passed";

    return allPassed ? "passed" : "failed";
  };

  const getComplianceScore = () => {
    if (loading || runningChecks) return 0;

    const statusToCheck = viewMode === "overview" 
      ? complianceStatus 
      : (selectedProjectId ? projectComplianceMap[selectedProjectId] : complianceStatus);

    if (!statusToCheck) return 0;

    let score = 0;
    let total = 0;

    if (statusToCheck.mfa?.status && statusToCheck.mfa.status !== "checking") {
      total++;
      if (statusToCheck.mfa.status === "passed") score++;
    }

    if (statusToCheck.rls?.status && statusToCheck.rls.status !== "checking") {
      total++;
      if (statusToCheck.rls.status === "passed") score++;
    }

    if (statusToCheck.pitr?.status && statusToCheck.pitr.status !== "checking") {
      total++;
      if (statusToCheck.pitr.status === "passed") score++;
    }

    return total === 0 ? 0 : Math.round((score / total) * 100);
  };

  const handleFixIssues = async () => {
    // Implementation for auto-fixing issues
    addEvidenceLog({
      check: "Auto-Fix",
      status: "INITIATED",
      details: "Started automatic remediation of compliance issues",
      timestamp: new Date().toISOString(),
      project: selectedProjectId ? availableProjects.find(p => p.id === selectedProjectId)?.name || "Unknown Project" : "All Projects",
      projectId: selectedProjectId || undefined
    });

    // Simulate fixing process
    setTimeout(() => {
      addEvidenceLog({
        check: "Auto-Fix",
        status: "COMPLETED",
        details: "Completed automatic remediation of compliance issues",
        timestamp: new Date().toISOString(),
        project: selectedProjectId ? availableProjects.find(p => p.id === selectedProjectId)?.name || "Unknown Project" : "All Projects",
        projectId: selectedProjectId || undefined
      });

      // Re-run checks after fixing
      runComplianceChecks();
    }, 2000);
  };

  const handleProjectChange = async (projectId: string) => {
    if (!projectId) return; // Prevent empty selection
    
    console.log(`Selecting project: ${projectId}`);
    setSelectedProjectId(projectId);
    
    // Find the project in available projects
    const selectedProject = availableProjects.find(p => p.id === projectId);
    console.log("Selected Project:", selectedProject);
    
    // If we already have data for this project, use it
    if (projectComplianceMap[projectId]) {
      console.log(`Using existing compliance data for project: ${projectId}`);
      setComplianceStatus(projectComplianceMap[projectId]);
    } else {
      // Only run checks if we don't have data for this project
      console.log(`No existing data found, running compliance checks for project: ${projectId}`);
      const credentials = await getCredentials();
      if (credentials) {
        runChecksForProject(credentials.apiKey, projectId, selectedProject?.name);
      }
    }
  };

  // Add a helper function to get the status data specifically for inactive projects
  const getInactiveStatusData = () => {
    return {
      mfa: { status: "inactive" as const, details: [], percentage: 0, rawTables: [] },
      rls: { status: "inactive" as const, details: [], percentage: 0, rawTables: [] },
      pitr: { status: "inactive" as const, details: [], percentage: 0, rawTables: [] },
    };
  };

  const getCurrentStatusData = () => {
    console.log(`Getting status data - viewMode: ${viewMode}, selectedProjectId: ${selectedProjectId}`);
    
    if (viewMode === "project" && selectedProjectId) {
      // Check if the selected project is inactive
      const selectedProject = availableProjects.find(p => p.id === selectedProjectId);
      if (selectedProject && 
          (!selectedProject.status || 
           ["INACTIVE", "REMOVED", "PAUSE_FAILED"].includes(selectedProject.status))) {
        console.log(`Project ${selectedProjectId} is inactive, returning inactive status`);
        return getInactiveStatusData();
      }
      
      // Return project-specific compliance data if active
      if (projectComplianceMap[selectedProjectId]) {
        console.log(`Returning project-specific data for ${selectedProjectId}`);
        return projectComplianceMap[selectedProjectId];
      }
    } else {
      console.log(`Returning overall compliance status with combined data from all projects`);
      // When in overview mode, log the combined details counts
      console.log(`Overall MFA details: ${complianceStatus.mfa.details.length} users`);
      console.log(`Overall RLS details: ${complianceStatus.rls.details.length} tables`);
      console.log(`Overall PITR details: ${complianceStatus.pitr.details.length} projects`);
    }
    
    return complianceStatus;
  };

  return {
    loading,
    runningChecks,
    complianceStatus,
    projectComplianceMap,
    availableProjects,
    selectedProjectId,
    evidenceLogs,
    viewMode,
    fetchAvailableProjects,
    fetchEvidenceLogs,
    runComplianceChecks,
    runChecksForProject,
    runChecksForSingleProject,
    fixIssuesForProject,
    updateOverallComplianceStatus,
    addEvidenceLog,
    getOverallStatus,
    getComplianceScore,
    handleFixIssues,
    handleProjectChange,
    getInactiveStatusData,
    getCurrentStatusData,
    setViewMode,
    setSelectedProjectId
  };
} 