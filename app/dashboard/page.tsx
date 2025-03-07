"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useComplianceData } from "@/lib/hooks/useComplianceData"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import ComplianceStatusCards from "@/components/dashboard/ComplianceStatusCards"
import ProjectSelector from "@/components/dashboard/ProjectSelector"
import ComplianceTabs from "@/components/dashboard/ComplianceTabs"
import { 
  PageTransition
} from "@/components/ui/animations"
import { DownloadLogs } from "@/components/DownloadLogs"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [modeTransition, setModeTransition] = useState<"idle" | "to-project" | "to-overview">("idle")
  const [previousProject, setPreviousProject] = useState<string | null>(null)
  // Keep the state to track when compliance checks are running
  const [checksTransition, setChecksTransition] = useState<"idle" | "running" | "completed">("idle")
  
  const {
    loading,
    runningChecks,
    availableProjects,
    selectedProjectId,
    projectComplianceMap,
    evidenceLogs,
    viewMode,
    runComplianceChecks,
    runChecksForSingleProject,
    fixIssuesForProject,
    handleFixIssues,
    handleProjectChange,
    getOverallStatus,
    getComplianceScore,
    getCurrentStatusData,
    addEvidenceLog,
    fetchEvidenceLogs,
    setViewMode,
    setSelectedProjectId,
    complianceStatus,
    hasCredentials
  } = useComplianceData()

  // Track previous viewMode to determine transition direction
  useEffect(() => {
    if (viewMode === "project") {
      setModeTransition("to-project");
    } else {
      setModeTransition("to-overview");
    }
    
    // Reset to idle after animation completes
    const timer = setTimeout(() => {
      setModeTransition("idle");
    }, 400);
    
    return () => clearTimeout(timer);
  }, [viewMode]);
  
  // Track checks running state for animations
  useEffect(() => {
    if (!runningChecks) {
      // When checks finish running, set to completed
      setChecksTransition("completed");
      
      // Reset to idle after animation completes
      const timer = setTimeout(() => {
        setChecksTransition("idle");
      }, 600);
      
      return () => clearTimeout(timer);
    } else {
      // When checks start running
      setChecksTransition("running");
    }
  }, [runningChecks]);
  
  // Track project changes for animations
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== previousProject) {
      setPreviousProject(selectedProjectId);
    }
  }, [selectedProjectId, previousProject]);

  const statusData = getCurrentStatusData() || {
    mfa: { status: "checking", details: [], percentage: 0 },
    rls: { status: "checking", details: [], percentage: 0 },
    pitr: { status: "checking", details: [], percentage: 0 },
  }

  // Find the selected project name if available
  const selectedProjectName = selectedProjectId ? 
    availableProjects.find(p => p.id === selectedProjectId)?.name : null
    
  // Animation variants for view transitions
  const pageContainerVariants = {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 }
  };
  
  // More fluid spring transition
  const springTransition = {
    type: "spring",
    stiffness: 300,
    damping: 26,
    mass: 1
  };
  
  // Project selector variants with a more fluid transition
  const projectSelectorVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      y: -8,
      marginBottom: 0,
      transition: { 
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1] // Material Design easing
      }
    },
    visible: { 
      opacity: 1, 
      height: "auto", 
      y: 0,
      marginBottom: 24,
      transition: { 
        height: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        },
        opacity: {
          duration: 0.2,
          delay: 0.1
        },
        y: springTransition
      }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      y: -8,
      marginBottom: 0,
      transition: { 
        height: {
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1]
        },
        opacity: {
          duration: 0.1
        },
        y: {
          duration: 0.2
        }
      }
    }
  };
    
  return (
    <PageTransition className="container py-10 relative z-0">
      <motion.div 
        className="flex flex-col"
        variants={pageContainerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <DashboardHeader 
          viewMode={viewMode}
          onViewModeChange={(value) => {
            setViewMode(value);
            
            // If switching to project mode and no project is selected, select the first available project
            if (value === "project" && !selectedProjectId && availableProjects.length > 0) {
              // Use the first available project but only trigger full checks if we don't have data for it
              const firstProjectId = availableProjects[0].id;
              if (projectComplianceMap[firstProjectId]) {
                // Just update the selected project without running checks if we already have data
                setSelectedProjectId(firstProjectId);
              } else {
                // Only run checks if we don't have data for this project
                handleProjectChange(firstProjectId);
              }
            }
          }}
          availableProjects={availableProjects}
          runningChecks={runningChecks}
          runComplianceChecks={runComplianceChecks}
          runChecksForSingleProject={runChecksForSingleProject}
          handleFixIssues={handleFixIssues}
          selectedProjectId={selectedProjectId}
          getOverallStatus={getOverallStatus}
          modeTransition={modeTransition}
          complianceStatus={complianceStatus}
          hasCredentials={hasCredentials}
        />

        <AnimatePresence mode="wait">
          {viewMode === "project" && availableProjects.length > 0 && selectedProjectId && (
            <motion.div
              key="project-selector"
              variants={projectSelectorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden"
              layout
            >
              <ProjectSelector 
                projects={availableProjects}
                complianceMap={projectComplianceMap}
                selectedProjectId={selectedProjectId}
                onSelectProject={(projectId) => {
                  // Set previous project before changing
                  setPreviousProject(selectedProjectId);
                  handleProjectChange(projectId);
                }}
                onRunChecks={runChecksForSingleProject}
                onFixIssues={fixIssuesForProject}
                runComplianceChecks={runComplianceChecks}
                runningChecks={runningChecks}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="mt-6"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={springTransition}
        >
          <ComplianceStatusCards 
            loading={loading}
            runningChecks={runningChecks}
            runComplianceChecks={runComplianceChecks}
            runChecksForSingleProject={runChecksForSingleProject}
            handleFixIssues={handleFixIssues}
            getOverallStatus={getOverallStatus}
            getComplianceScore={getComplianceScore}
            viewMode={viewMode}
            selectedProjectId={selectedProjectId}
            projectName={selectedProjectName || "Selected Project"}
            evidenceLogs={evidenceLogs}
            modeTransition={modeTransition}
            complianceStatus={complianceStatus}
            availableProjects={availableProjects}
          />
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          <ComplianceTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            statusData={statusData}
            viewMode={viewMode}
            selectedProjectId={selectedProjectId}
            handleProjectChange={handleProjectChange}
            setViewMode={setViewMode}
            getOverallStatus={getOverallStatus}
            evidenceLogs={evidenceLogs}
            addEvidenceLog={addEvidenceLog}
            fetchEvidenceLogs={fetchEvidenceLogs}
            availableProjects={availableProjects}
            loading={loading}
          />
        </motion.div>

        {/* Show download logs option for non-authenticated users */}
        <DownloadLogs logs={evidenceLogs} />
      </motion.div>
    </PageTransition>
  )
}

