import { motion } from "framer-motion"
import { ReactNode } from "react"

// Fade in animation for components coming into view
export const FadeIn = ({ 
  children, 
  delay = 0,
  duration = 0.5,
  className = ""
}: { 
  children: ReactNode,
  delay?: number,
  duration?: number, 
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

// Slide up and fade in animation
export const SlideUp = ({ 
  children, 
  delay = 0,
  duration = 0.5,
  className = ""
}: { 
  children: ReactNode,
  delay?: number,
  duration?: number,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

// Slide in from left animation
export const SlideInLeft = ({ 
  children, 
  delay = 0,
  duration = 0.5,
  className = ""
}: { 
  children: ReactNode,
  delay?: number,
  duration?: number,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

// Slide in from right animation
export const SlideInRight = ({ 
  children, 
  delay = 0,
  duration = 0.5,
  className = ""
}: { 
  children: ReactNode,
  delay?: number,
  duration?: number,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 50 }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

// Scale animation for elements that need to pop
export const ScaleIn = ({ 
  children, 
  delay = 0,
  duration = 0.5,
  className = ""
}: { 
  children: ReactNode,
  delay?: number,
  duration?: number,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

// Page transition for switching between views
export const PageTransition = ({ 
  children,
  className = ""
}: { 
  children: ReactNode,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
)

// Staggered children animation container
export const StaggerContainer = ({ 
  children,
  className = "",
  delayChildren = 0.1,
  staggerChildren = 0.1
}: { 
  children: ReactNode,
  className?: string,
  delayChildren?: number,
  staggerChildren?: number
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          delayChildren,
          staggerChildren
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
)

// Child item for use with StaggerContainer
export const StaggerItem = ({ 
  children,
  className = ""
}: { 
  children: ReactNode,
  className?: string
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    className={className}
  >
    {children}
  </motion.div>
)

// Animation for tab content switching
export const TabContentAnimation = ({ 
  children,
  className = ""
}: { 
  children: ReactNode,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
)

// Specialized fast mode transition animations
export const ViewTransitionFadeLeft = ({ 
  children,
  isActive = true,
  className = ""
}: { 
  children: ReactNode,
  isActive?: boolean,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ 
      opacity: isActive ? 1 : 0, 
      x: isActive ? 0 : -20,
      transition: { duration: 0.2 }
    }}
    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
    className={className}
  >
    {children}
  </motion.div>
)

export const ViewTransitionFadeRight = ({ 
  children,
  isActive = true,
  className = ""
}: { 
  children: ReactNode,
  isActive?: boolean,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ 
      opacity: isActive ? 1 : 0, 
      x: isActive ? 0 : 20,
      transition: { duration: 0.2 }
    }}
    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
    className={className}
  >
    {children}
  </motion.div>
)

// Coordinated view mode switching container
export const ViewModeSwitchContainer = ({
  children,
  className = ""
}: {
  children: ReactNode,
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 1 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 1 }}
    className={className}
  >
    {children}
  </motion.div>
)

// Navigation link animation
export const NavLink = ({ 
  children, 
  isActive = false,
  className = "" 
}: { 
  children: ReactNode,
  isActive?: boolean,
  className?: string 
}) => (
  <motion.div
    className={`relative ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
    {isActive && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        layoutId="navIndicator"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
  </motion.div>
) 