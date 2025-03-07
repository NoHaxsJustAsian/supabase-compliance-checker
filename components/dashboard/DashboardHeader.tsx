import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck, Database, MessageSquare, Bot, AlertCircle, Key } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProjectInfo } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { ViewTransitionFadeLeft, ViewTransitionFadeRight } from "@/components/ui/animations";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatSheet } from "@/components/ChatSheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

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
  hasCredentials?: boolean | null; // Whether the user has set their PAT
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
  complianceStatus,
  hasCredentials
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
    <>
      {hasCredentials === false && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <div className="ml-2">
              <AlertTitle className="text-amber-800 dark:text-amber-400">API Access Required</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                You need to set up a Supabase Personal Access Token (PAT) to run compliance checks.{" "}
                <Link href="/auth?tab=pat" className="font-medium underline underline-offset-4 hover:text-amber-900 dark:hover:text-amber-200">
                  Set up API access now
                </Link>
              </AlertDescription>
            </div>
          </Alert>
        </motion.div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {viewMode === "overview" ? "Compliance Dashboard" : "Project Compliance"}
          </h1>
        </div>
        
        <div className="flex space-x-2 items-center">
          {hasCredentials === false && (
            <Link href="/auth?tab=pat">
              <Button variant="outline" size="sm" className="mr-2 flex items-center gap-1">
                <Key className="h-3.5 w-3.5" />
                Set API Token
              </Button>
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2 relative group">
                <MessageSquare className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md w-[90vw] p-0 border-l border-l-border/50">
              <div className="h-full flex flex-col">
                <SheetHeader className="px-4 py-3 border-b border-border/50">
                  <SheetTitle className="text-lg flex items-center">
                    <Bot className="mr-2 h-5 w-5 text-blue-600" />
                    Compliance Assistant
                  </SheetTitle>
                  <SheetDescription className="text-sm">
                    Ask about potential compliance issues and how to resolve them
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                  <ChatSheet />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
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
    </>
  );
} 