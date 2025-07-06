import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  tooltip?: string;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    loading = false,
    loadingText,
    tooltip,
    fullWidth = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        className={cn(
          // Base styles with improved focus and accessibility
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
          // Enhanced hover and active states
          "hover:scale-[1.02] active:scale-[0.98] transform-gpu",
          // Variant styles with improved contrast and visual hierarchy
          {
            // Default - Primary action button
            "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-sm hover:shadow-md": variant === "default",
            
            // Destructive - For dangerous actions with clear warning
            "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm hover:shadow-md": variant === "destructive",
            
            // Outline - Secondary actions
            "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-500": variant === "outline",
            
            // Secondary - Tertiary actions
            "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500": variant === "secondary",
            
            // Ghost - Minimal actions
            "text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500": variant === "ghost",
            
            // Link - Text-based actions
            "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500 hover:text-blue-700": variant === "link",
          },
          // Size variants with improved proportions
          {
            "h-10 px-4 py-2 text-sm": size === "default",
            "h-8 px-3 py-1 text-xs rounded": size === "sm",
            "h-12 px-6 py-3 text-base rounded-lg": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          // Full width option
          {
            "w-full": fullWidth,
          },
          // Loading state styling
          {
            "cursor-not-allowed": loading,
            "hover:scale-100 active:scale-100": loading, // Disable transform when loading
          },
          className
        )}
        disabled={isDisabled}
        ref={ref}
        title={tooltip}
        aria-label={tooltip}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
