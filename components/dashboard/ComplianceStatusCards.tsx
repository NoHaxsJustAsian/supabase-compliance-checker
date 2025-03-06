import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ShieldCheck, AlertOctagon, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { FixIssuesDrawer } from "../FixIssuesDrawer";

interface ComplianceStatusCardsProps {
  loading: boolean;
  runningChecks: boolean;
  runComplianceChecks: () => void;
  runChecksForSingleProject?: (projectId: string) => void;
  handleFixIssues: () => void;
  getOverallStatus: () => string;
  getComplianceScore: () => number;
  viewMode: "overview" | "project";
  selectedProjectId: string | null;
  projectName?: string;
  evidenceLogs: any[];
  modeTransition: "idle" | "to-project" | "to-overview";
  complianceStatus?: any;
  availableProjects?: any[];
}

export default function ComplianceStatusCards({
  loading,
  runningChecks,
  runComplianceChecks,
  runChecksForSingleProject,
  handleFixIssues,
  getOverallStatus,
  getComplianceScore,
  viewMode,
  selectedProjectId,
  projectName,
  evidenceLogs,
  modeTransition,
  complianceStatus,
  availableProjects = []
}: ComplianceStatusCardsProps) {
  // Track if the fix button should be shown (preserve during loading)
  const [showFixButton, setShowFixButton] = useState(false);
  
  // Update the button visibility when status changes but not during loading
  useEffect(() => {
    if (!runningChecks) {
      setShowFixButton(viewMode === "overview" && getOverallStatus() === "failed");
    }
  }, [viewMode, getOverallStatus, runningChecks]);
  
  // Direction for animations based on view mode transition
  const getSlideDirection = () => {
    if (modeTransition === "to-project") return 1;
    if (modeTransition === "to-overview") return -1;
    return 0;
  };
  
  // Better spring animation for fluid transitions
  const springTransition = { 
    type: "spring", 
    stiffness: 500,  // Increased from 350 to 500 for faster animation
    damping: 28,     // Increased from 25 to 28 to reduce bounce
    mass: 0.8        // Reduced from 1 to 0.8 for faster animation
  };
  
  // Faster mode for status and title animations
  const fasterSpringTransition = {
    type: "spring",
    stiffness: 650,  // Even faster than the main spring
    damping: 30,     // Higher damping for less bounce
    mass: 0.6        // Lower mass for faster movement
  };
  
  // Card content animation variants
  const cardContentVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      y: 5 * direction,
      transition: springTransition
    }),
    animate: {
      opacity: 1,
      y: 0,
      transition: springTransition
    },
    exit: (direction: number) => ({
      opacity: 0,
      y: -5 * direction,
      transition: springTransition
    })
  };
  
  // Project name animation variants matching the Overall Status style
  const projectNameVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.95,
      transition: fasterSpringTransition
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: fasterSpringTransition
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: fasterSpringTransition
    }
  };
  
  // Card variants with subtle scale
  const cardVariants = {
    initial: { opacity: 0.95, scale: 0.99 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        ...springTransition,
        staggerChildren: 0.03,
        delayChildren: 0.02
      }
    }
  };
  
  // Status icon variants with better spring animation
  const statusIconVariants = {
    initial: { opacity: 0, scale: 0.5, rotate: 0 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: fasterSpringTransition
    },
    exit: { 
      opacity: 0, 
      scale: 0.5, 
      rotate: 180,
      transition: fasterSpringTransition
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
    >
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <Card className={runningChecks ? "border-blue-300" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="relative overflow-hidden min-h-[60px] flex items-center">
                <div className="w-full">
                  <CardTitle className="text-xl">
                    {viewMode === "overview" ? 
                      "Overall Compliance Status" : 
                      projectName || "Selected Project"
                    }
                  </CardTitle>
                  <CardDescription>
                    {viewMode === "overview" ? 
                      "Compliance status across all projects" : 
                      "Project compliance status"
                    }
                  </CardDescription>
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runningChecks ? null : viewMode === "overview" ? runComplianceChecks() : runChecksForSingleProject?.(selectedProjectId || "")}
                  disabled={runningChecks}
                  className="min-w-[150px]"
                >
                  {runningChecks ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Checks...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Run Compliance Checks
                    </>
                  )}
                </Button>
                
                <FixIssuesDrawer
                  onFixIssues={handleFixIssues}
                  complianceStatus={complianceStatus}
                  availableProjects={availableProjects}
                  isAllProjects={viewMode === "overview"}
                  projectId={selectedProjectId || undefined}
                  projectName={projectName}
                  disabled={!showFixButton || runningChecks}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StaggerContainer 
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-40"
              delayChildren={0.1}
              staggerChildren={0.1}
            >
              <StaggerItem>
                <Card className={`${runningChecks ? "border-blue-200" : ""} h-full`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 min-h-[40px]">
                      <AnimatePresence mode="wait">
                        {(getOverallStatus() === "checking" || runningChecks) && (
                          <motion.div
                            key="checking"
                            variants={statusIconVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <AlertTriangle className={`h-5 w-5 text-yellow-500 ${runningChecks ? "animate-pulse" : ""}`} />
                          </motion.div>
                        )}
                        {getOverallStatus() === "passed" && !runningChecks && (
                          <motion.div
                            key="passed"
                            variants={statusIconVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                          </motion.div>
                        )}
                        {getOverallStatus() === "failed" && !runningChecks && (
                          <motion.div
                            key="failed"
                            variants={statusIconVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                          </motion.div>
                        )}
                        {getOverallStatus() === "error" && !runningChecks && (
                          <motion.div
                            key="error"
                            variants={statusIconVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <AlertOctagon className="h-5 w-5 text-red-500" />
                          </motion.div>
                        )}
                        {getOverallStatus() === "inactive" && !runningChecks && (
                          <motion.div
                            key="inactive"
                            variants={statusIconVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <Clock className="h-5 w-5 text-gray-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={getOverallStatus() + (runningChecks ? "-checking" : "")}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={fasterSpringTransition}
                          className="text-2xl font-bold"
                        >
                          {(getOverallStatus() === "checking" || runningChecks) && "Checking..."}
                          {getOverallStatus() === "passed" && !runningChecks && "Compliant"}
                          {getOverallStatus() === "failed" && !runningChecks && "Non-Compliant"}
                          {getOverallStatus() === "error" && !runningChecks && "Error"}
                          {getOverallStatus() === "inactive" && !runningChecks && "Inactive Project"}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2 min-h-[40px]">
                      <span className="text-2xl font-bold">
                        {runningChecks ? (
                          <div className="flex items-center">
                            <motion.span 
                              animate={{ 
                                opacity: [0.6, 1, 0.6],
                                transition: { repeat: Infinity, duration: 1.5 }
                              }}
                            >
                              {getComplianceScore()}%
                            </motion.span>
                          </div>
                        ) : (
                          `${getComplianceScore()}%`
                        )}
                      </span>
                      <Progress value={getComplianceScore()} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Last Check</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-[40px] flex items-center">
                      <span className="text-xl font-medium">
                        {evidenceLogs.length > 0 ? new Date(evidenceLogs[0].timestamp).toLocaleString() : "Never"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Evidence Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-[40px] flex items-center">
                      <span className="text-xl font-medium">
                        {runningChecks ? (
                          <span className="flex items-center">
                            <span>{evidenceLogs.length}</span>
                            <motion.span 
                              className="ml-1 text-blue-500 text-sm"
                              animate={{ 
                                opacity: [0.6, 1, 0.6],
                                transition: { repeat: Infinity, duration: 1.5 }
                              }}
                            >
                              + generating...
                            </motion.span>
                          </span>
                        ) : (
                          `${evidenceLogs.length} entries`
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggerContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
} 