import { motion } from "framer-motion";
import logoImage from "@/assets/logo.png";

interface LogoSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LogoSpinner({ size = "md", text }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  const containerSizes = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${containerSizes[size]}`}>
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner pulsing ring */}
        <motion.div
          className="absolute inset-2 rounded-full border border-secondary/40"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo with pulse animation */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <img 
            src={logoImage} 
            alt="Loading" 
            className={`${sizeClasses[size]} object-contain`}
          />
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/10 blur-xl"
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {text && (
        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LogoSpinner size="lg" text="Loading..." />
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <LogoSpinner size="md" />
    </div>
  );
}