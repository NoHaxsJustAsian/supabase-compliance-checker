"use client"

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Define spring transition properties for fluid animations
export const fluidSpringTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1
};

// Context for navigation animations - but with more conservative behavior
type NavigationContextType = {
  isNavigating: boolean;
  currentPath: string;
};

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  currentPath: "/"
});

export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Much simpler implementation without transitions that could cause elements to disappear
  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        currentPath: pathname
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

// Page transition component with simplified animation that won't cause page content to disappear
export function PageTransitionWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}

// Simplified link transition effect without any animations
export function LinkTransitionEffect({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
} 