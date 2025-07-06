import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  position = "top", 
  delay = 500,
  className = ""
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 200; // Approximate tooltip width
    const tooltipHeight = 40; // Approximate tooltip height
    const padding = 8;

    let x = 0;
    let y = 0;

    switch (position) {
      case "top":
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - padding;
        break;
      case "bottom":
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + padding;
        break;
      case "left":
        x = rect.left - tooltipWidth - padding;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case "right":
        x = rect.right + padding;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));

    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipElement = isVisible ? (
    <div
      className={`fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg pointer-events-none max-w-xs ${className}`}
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
      }}
    >
      {content}
      <div
        className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
          position === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2" :
          position === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2" :
          position === "left" ? "right-[-4px] top-1/2 -translate-y-1/2" :
          "left-[-4px] top-1/2 -translate-y-1/2"
        }`}
      />
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {typeof document !== "undefined" && tooltipElement && 
        createPortal(tooltipElement, document.body)
      }
    </>
  );
}
