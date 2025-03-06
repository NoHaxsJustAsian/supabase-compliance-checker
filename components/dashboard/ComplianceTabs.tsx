import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import UsersList from "@/components/users-list";
import TablesList from "@/components/tables-list";
import ProjectsList from "@/components/projects-list";
import EvidenceLog from "@/components/evidence-log";
import { Clock, Loader2, RefreshCw } from "lucide-react";
import { ComplianceStatus } from "@/lib/types";
import ComplianceOverview from "./ComplianceOverview";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ComplianceTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  statusData: ComplianceStatus;
  viewMode: "overview" | "project";
  selectedProjectId: string | null;
  handleProjectChange: (projectId: string) => void;
  setViewMode: (mode: "overview" | "project") => void;
  getOverallStatus: () => string;
  evidenceLogs: any[];
  addEvidenceLog: (log: any) => void;
  fetchEvidenceLogs: () => Promise<void>;
  availableProjects: any[];
  loading: boolean;
}

export default function ComplianceTabs({
  activeTab,
  setActiveTab,
  statusData,
  viewMode,
  selectedProjectId,
  handleProjectChange,
  setViewMode,
  getOverallStatus,
  evidenceLogs,
  addEvidenceLog,
  fetchEvidenceLogs,
  availableProjects,
  loading
}: ComplianceTabsProps) {
  const isInactive = getOverallStatus() === "inactive";
  const runningChecks = loading || getOverallStatus() === "checking";
  
  // Track previous tab to determine animation direction
  const [previousTab, setPreviousTab] = useState(activeTab);
  const [direction, setDirection] = useState(0);
  
  // Map tabs to numeric indices to determine direction
  const tabToIndex = {
    overview: 0,
    users: 1,
    tables: 2,
    projects: 3,
    evidence: 4
  };
  
  // Update direction when tab changes
  useEffect(() => {
    if (previousTab !== activeTab) {
      const prevIndex = tabToIndex[previousTab as keyof typeof tabToIndex] || 0;
      const currIndex = tabToIndex[activeTab as keyof typeof tabToIndex] || 0;
      setDirection(currIndex > prevIndex ? 1 : -1);
      setPreviousTab(activeTab);
    }
  }, [activeTab, previousTab]);

  // Create loading-aware status data to immediately mask previous results when loading
  const displayStatusData = runningChecks ? {
    mfa: { status: "checking" as const, details: [], percentage: 0, rawTables: [] },
    rls: { status: "checking" as const, details: [], percentage: 0, rawTables: [] },
    pitr: { status: "checking" as const, details: [], percentage: 0, rawTables: [] }
  } : statusData;

  // Define the variants based on direction
  const getTabVariants = () => ({
    hidden: { opacity: 0, x: 20 * direction, transition: { duration: 0.2 } },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: -20 * direction, transition: { duration: 0.2 } }
  });

  // Simpler sheet closing animation for content when running checks
  const sheetCloseVariants = {
    visible: { 
      opacity: 1, 
      y: 0, 
      height: "auto",
      scaleY: 1,
      transformOrigin: "top",
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1]  // Material UI easing for natural feel
      } 
    },
    exit: { 
      opacity: 0, 
      y: -15, 
      height: "auto",
      scaleY: 0.95,
      transformOrigin: "top",
      transition: { 
        duration: 0.25, 
        ease: [0.4, 0, 0.2, 1] 
      } 
    }
  };

  // Card content animation for when checks are running
  const cardContentAnimVariants = {
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  // Tab button variants with spring animation for better feedback
  const tabButtonVariants = {
    active: {
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    inactive: {
      backgroundColor: "transparent",
      color: "var(--muted-foreground)",
      opacity: 0.8,
      scale: 0.98,
      transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    hover: { 
      scale: 1.04, 
      opacity: 1,
      transition: { duration: 0.1 } 
    },
    tap: { 
      scale: 0.98,
      opacity: 1,
      transition: { duration: 0.1 } 
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => {
      // Set the direction before changing tab
      const prevIndex = tabToIndex[activeTab as keyof typeof tabToIndex] || 0;
      const nextIndex = tabToIndex[value as keyof typeof tabToIndex] || 0;
      setDirection(nextIndex > prevIndex ? 1 : -1);
      setActiveTab(value);
    }}>
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="relative mb-2"
      >
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(tabToIndex).map(([tab, index]) => (
            <motion.div 
              key={tab}
              initial="inactive"
              animate={activeTab === tab ? "active" : "inactive"}
              whileHover="hover"
              whileTap="tap"
              variants={tabButtonVariants}
              className="relative"
            >
              <TabsTrigger value={tab} className="relative w-full px-3 py-1.5 z-10">
                {tab === "overview" && "Overview"}
                {tab === "users" && "Users & MFA"}
                {tab === "tables" && "Tables & RLS"}
                {tab === "projects" && "Projects & PITR"}
                {tab === "evidence" && "Evidence Logs"}
                {runningChecks && activeTab === tab && (
                  <RefreshCw className="ml-2 h-3 w-3 inline animate-spin text-blue-500" />
                )}
              </TabsTrigger>
            </motion.div>
          ))}
        </TabsList>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        {activeTab === "overview" && (
          <motion.div
            key={`overview-${runningChecks ? "running" : "idle"}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getTabVariants()}
            className="mt-3 relative overflow-hidden"
          >
            <TabsContent value="overview" forceMount>
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Insights</CardTitle>
                  <CardDescription>Detailed overview of compliance status</CardDescription>
                </CardHeader>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={runningChecks ? "loading" : "content"}
                    variants={cardContentAnimVariants}
                    initial={runningChecks ? "hidden" : "visible"}
                    animate="visible"
                    exit="hidden"
                    className="overflow-hidden"
                  >
                    {!runningChecks && (
                      <CardContent>
                        <ComplianceOverview 
                          statusData={displayStatusData} 
                          viewMode={viewMode}
                          selectedProjectId={selectedProjectId}
                          handleProjectChange={handleProjectChange}
                          setViewMode={setViewMode}
                          runningChecks={runningChecks}
                        />
                      </CardContent>
                    )}
                  </motion.div>
                </AnimatePresence>
                {runningChecks && (
                  <CardContent className="flex justify-center items-center py-10">
                    <motion.div 
                      className="flex flex-col items-center space-y-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      <p className="text-sm text-muted-foreground">Running compliance checks...</p>
                    </motion.div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div
            key="users"
            custom={direction}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getTabVariants()}
            className="mt-3 relative overflow-hidden"
          >
            <TabsContent value="users" forceMount>
              {isInactive ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Users & MFA Status</CardTitle>
                    <CardDescription>Multi-Factor Authentication status for users</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center py-10">
                    <div className="flex flex-col items-center space-y-4">
                      <Clock className="h-8 w-8 text-gray-500" />
                      <p className="text-sm text-muted-foreground">This project is inactive. Please start the project to run compliance checks.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Users & MFA Status</CardTitle>
                    <CardDescription>Multi-Factor Authentication status for users</CardDescription>
                  </CardHeader>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={runningChecks ? "loading" : "content"}
                      variants={cardContentAnimVariants}
                      initial={runningChecks ? "hidden" : "visible"}
                      animate="visible"
                      exit="hidden"
                      className="overflow-hidden"
                    >
                      {!runningChecks && (
                        <CardContent>
                          <UsersList
                            users={displayStatusData?.mfa?.details || []}
                            loading={runningChecks}
                            onFixUser={(userId) => {
                              // Get the user to find their project ID
                              const user = displayStatusData?.mfa?.details.find((u: any) => u.id === userId);
                              const projectId = user?.project_id || selectedProjectId;
                              
                              addEvidenceLog({
                                check: "MFA Enforcement",
                                status: "ACTION",
                                details: `Enforced MFA for user ID: ${userId}`,
                                timestamp: new Date().toISOString(),
                                project: projectId ? availableProjects.find(p => p.id === projectId)?.name || "Unknown Project" : "All Projects",
                                projectId: projectId || undefined
                              });
                            }}
                            isProjectView={viewMode === "project"}
                            selectedProjectId={selectedProjectId}
                          />
                        </CardContent>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {runningChecks && (
                    <CardContent className="flex justify-center items-center py-10">
                      <motion.div 
                        className="flex flex-col items-center space-y-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-muted-foreground">Running compliance checks...</p>
                      </motion.div>
                    </CardContent>
                  )}
                </Card>
              )}
            </TabsContent>
          </motion.div>
        )}

        {activeTab === "tables" && (
          <motion.div
            key={`tables-${runningChecks ? "running" : "idle"}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getTabVariants()}
            className="mt-3 relative overflow-hidden"
          >
            <TabsContent value="tables" forceMount>
              {isInactive ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Tables & RLS Status</CardTitle>
                    <CardDescription>Row Level Security status for tables</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center py-10">
                    <div className="flex flex-col items-center space-y-4">
                      <Clock className="h-8 w-8 text-gray-500" />
                      <p className="text-sm text-muted-foreground">This project is inactive. Please start the project to run compliance checks.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Tables & RLS Status</CardTitle>
                    <CardDescription>Row Level Security status for tables</CardDescription>
                  </CardHeader>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={runningChecks ? "loading" : "content"}
                      variants={cardContentAnimVariants}
                      initial={runningChecks ? "hidden" : "visible"}
                      animate="visible"
                      exit="hidden"
                      className="overflow-hidden"
                    >
                      {!runningChecks && (
                        <CardContent>
                          <TablesList 
                            tables={displayStatusData?.rls?.details || []} 
                            loading={runningChecks}
                            onEnableRls={(tableId) => {
                              // Get the table to find its project ID
                              const table = displayStatusData?.rls?.details.find((t: any) => t.id === tableId);
                              const projectId = table?.project_id || selectedProjectId;
                              
                              addEvidenceLog({
                                check: "RLS Enforcement",
                                status: "ACTION",
                                details: `Enabled RLS for table ID: ${tableId}`,
                                timestamp: new Date().toISOString(),
                                project: projectId ? availableProjects.find(p => p.id === projectId)?.name || "Unknown Project" : "All Projects",
                                projectId: projectId || undefined
                              });
                            }}
                            isProjectView={viewMode === "project"}
                            selectedProjectId={selectedProjectId}
                          />
                        </CardContent>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {runningChecks && (
                    <CardContent className="flex justify-center items-center py-10">
                      <motion.div 
                        className="flex flex-col items-center space-y-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-muted-foreground">Running compliance checks...</p>
                      </motion.div>
                    </CardContent>
                  )}
                </Card>
              )}
            </TabsContent>
          </motion.div>
        )}

        {activeTab === "projects" && (
          <motion.div
            key="projects"
            custom={direction}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getTabVariants()}
            className="mt-3 relative overflow-hidden"
          >
            <TabsContent value="projects" forceMount>
              {isInactive ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Projects & PITR Status</CardTitle>
                    <CardDescription>Point-in-Time Recovery status for projects</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center py-10">
                    <div className="flex flex-col items-center space-y-4">
                      <Clock className="h-8 w-8 text-gray-500" />
                      <p className="text-sm text-muted-foreground">This project is inactive. Please start the project to run compliance checks.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Projects & PITR Status</CardTitle>
                    <CardDescription>Point-in-Time Recovery status for projects</CardDescription>
                  </CardHeader>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={runningChecks ? "loading" : "content"}
                      variants={cardContentAnimVariants}
                      initial={runningChecks ? "hidden" : "visible"}
                      animate="visible"
                      exit="hidden"
                      className="overflow-hidden"
                    >
                      {!runningChecks && (
                        <CardContent>
                          <ProjectsList 
                            projects={displayStatusData?.pitr?.details || []} 
                            loading={runningChecks}
                            onEnablePitr={(projectId) => {
                              addEvidenceLog({
                                check: "PITR Enforcement",
                                status: "ACTION",
                                details: `Enabled PITR for project ID: ${projectId}`,
                                timestamp: new Date().toISOString(),
                                project: projectId ? availableProjects.find(p => p.id === projectId)?.name || "Unknown Project" : "All Projects",
                                projectId: projectId
                              });
                            }}
                            isProjectView={viewMode === "project"}
                            selectedProjectId={selectedProjectId}
                          />
                        </CardContent>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {runningChecks && (
                    <CardContent className="flex justify-center items-center py-10">
                      <motion.div 
                        className="flex flex-col items-center space-y-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-muted-foreground">Running compliance checks...</p>
                      </motion.div>
                    </CardContent>
                  )}
                </Card>
              )}
            </TabsContent>
          </motion.div>
        )}

        {activeTab === "evidence" && (
          <motion.div
            key="evidence"
            custom={direction}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={getTabVariants()}
            className="mt-3 relative overflow-hidden"
          >
            <TabsContent value="evidence" forceMount>
              <EvidenceLog 
                logs={evidenceLogs} 
                onSelectProject={(projectId) => {
                  handleProjectChange(projectId);
                  setViewMode("project");
                  setActiveTab("overview");
                }}
                isProjectView={viewMode === "project"}
                onRefresh={fetchEvidenceLogs}
                addEvidenceLog={addEvidenceLog}
              />
            </TabsContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Tabs>
  );
} 