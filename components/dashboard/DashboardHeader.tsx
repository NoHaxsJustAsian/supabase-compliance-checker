import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck, Database } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProjectInfo } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { ViewTransitionFadeLeft, ViewTransitionFadeRight } from "@/components/ui/animations";

interface DashboardHeaderProps {
  viewMode: "overview" | "project";
  onViewModeChange: (value: "overview" | "project") => void;
  availableProjects: ProjectInfo[];
  runningChecks: boolean;
  runComplianceChecks: () => void;
  runChecksForSingleProject: (projectId: string) => void;
  handleFixIssues: () => void;
  selectedProjectId: string | null;
  getOverallStatus: () => string;
  modeTransition: "idle" | "to-project" | "to-overview";
  complianceStatus?: any; // Add this to support compliance status data
}

export default function DashboardHeader({
  viewMode,
  onViewModeChange,
  availableProjects,
  runningChecks,
  runComplianceChecks,
  runChecksForSingleProject,
  handleFixIssues,
  selectedProjectId,
  getOverallStatus,
  modeTransition,
  complianceStatus
}: DashboardHeaderProps) {
  // Use the transition state to set animation properties
  const getSlideDirection = () => {
    if (modeTransition === "to-project") return 1;
    if (modeTransition === "to-overview") return -1;
    return 0;
  };
  
  const titleVariants = {
    initial: (direction: number) => ({ 
      opacity: 0, 
      x: 20 * direction,
      transition: { duration: 0.3, ease: "easeInOut" }
    }),
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    exit: (direction: number) => ({ 
      opacity: 0, 
      x: -20 * direction,
      transition: { duration: 0.3, ease: "easeInOut" }
    })
  };
  
  // Tab toggle button variants with spring animation
  const toggleVariants = {
    overview: {
      opacity: viewMode === "overview" ? 1 : 0.7,
      scale: viewMode === "overview" ? 1 : 0.97,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30
      }
    },
    project: {
      opacity: viewMode === "project" ? 1 : 0.7,
      scale: viewMode === "project" ? 1 : 0.97,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30
      }
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold">
          {viewMode === "overview" ? "Compliance Dashboard" : "Project Compliance"}
        </h1>
      </div>
      
      <div className="flex space-x-2">
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => {
            if (value) {
              onViewModeChange(value as "overview" | "project");
            }
          }}
        >
          <div className="relative">
            <motion.div
              variants={toggleVariants}
              animate="overview"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <ToggleGroupItem value="overview" disabled={runningChecks} className="flex items-center z-10 relative">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Overview Mode
              </ToggleGroupItem>
            </motion.div>
          </div>
          
          <div className="relative">
            <motion.div
              variants={toggleVariants}
              animate="project"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <ToggleGroupItem value="project" disabled={runningChecks || availableProjects.length === 0} className="flex items-center z-10 relative">
                <Database className="mr-2 h-4 w-4" />
                Project Mode
              </ToggleGroupItem>
            </motion.div>
          </div>
        </ToggleGroup>
      </div>
    </div>
  );
} 