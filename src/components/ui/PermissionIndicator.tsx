import { 
  Lock, 
  Download, 
  Printer, 
  Eye, 
  Users, 
  Shield, 
  AlertTriangle,
  Info
} from "lucide-react";
import { Tooltip } from "./Tooltip";

interface PermissionIndicatorProps {
  permissions: {
    canDownload?: boolean;
    canPrint?: boolean;
    canView?: boolean;
    watermarkEnabled?: boolean;
    isRestricted?: boolean;
  };
  visibleToGroups?: Array<{ name: string; userCount: number }>;
  className?: string;
  showLabels?: boolean;
}

export function PermissionIndicator({ 
  permissions, 
  visibleToGroups = [], 
  className = "",
  showLabels = false 
}: PermissionIndicatorProps) {
  const indicators = [];

  // Download permission
  if (permissions.canDownload === false) {
    indicators.push({
      icon: Download,
      label: "No Download",
      tooltip: "Downloads are restricted for this file",
      color: "text-red-600",
      bgColor: "bg-red-100",
    });
  }

  // Print permission
  if (permissions.canPrint === false) {
    indicators.push({
      icon: Printer,
      label: "No Print",
      tooltip: "Printing is restricted for this file",
      color: "text-red-600", 
      bgColor: "bg-red-100",
    });
  }

  // View-only indicator
  if (permissions.canView && permissions.canDownload === false && permissions.canPrint === false) {
    indicators.push({
      icon: Eye,
      label: "View-Only",
      tooltip: "This file is view-only - downloads and printing are disabled",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    });
  }

  // Watermark indicator
  if (permissions.watermarkEnabled) {
    indicators.push({
      icon: Shield,
      label: "Watermarked",
      tooltip: "This file will display with your name and timestamp as a watermark",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    });
  }

  // Restricted access indicator
  if (permissions.isRestricted) {
    indicators.push({
      icon: Lock,
      label: "Restricted",
      tooltip: "Access to this file is limited to specific user groups",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    });
  }

  // Visibility information
  let visibilityInfo = "";
  if (visibleToGroups.length > 0) {
    const totalUsers = visibleToGroups.reduce((sum, group) => sum + group.userCount, 0);
    visibilityInfo = `Visible to ${visibleToGroups.length} group${visibleToGroups.length > 1 ? 's' : ''} (${totalUsers} users): ${visibleToGroups.map(g => g.name).join(', ')}`;
  }

  if (indicators.length === 0 && !visibilityInfo) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Permission indicators */}
      {indicators.map((indicator, index) => {
        const Icon = indicator.icon;
        return (
          <Tooltip key={index} content={indicator.tooltip}>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${indicator.color} ${indicator.bgColor}`}>
              <Icon className="h-3 w-3" />
              {showLabels && <span>{indicator.label}</span>}
            </div>
          </Tooltip>
        );
      })}

      {/* Visibility indicator */}
      {visibilityInfo && (
        <Tooltip content={visibilityInfo}>
          <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
            <Users className="h-3 w-3" />
            {showLabels && <span>{visibleToGroups.length} group{visibleToGroups.length > 1 ? 's' : ''}</span>}
          </div>
        </Tooltip>
      )}
    </div>
  );
}

interface FilePermissionSummaryProps {
  fileName: string;
  permissions: {
    canDownload?: boolean;
    canPrint?: boolean;
    canView?: boolean;
    watermarkEnabled?: boolean;
  };
  visibleToGroups?: Array<{ name: string; userCount: number }>;
}

export function FilePermissionSummary({ 
  fileName, 
  permissions, 
  visibleToGroups = [] 
}: FilePermissionSummaryProps) {
  const totalUsers = visibleToGroups.reduce((sum, group) => sum + group.userCount, 0);
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            File Access Summary
          </h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <span className="font-medium">{fileName}</span> is visible to{' '}
              {visibleToGroups.length > 0 ? (
                <>
                  <span className="font-medium">{visibleToGroups.length} group{visibleToGroups.length > 1 ? 's' : ''}</span>{' '}
                  ({totalUsers} users total)
                </>
              ) : (
                <span className="font-medium">all data room users</span>
              )}
            </p>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <PermissionIndicator 
                permissions={permissions} 
                visibleToGroups={visibleToGroups}
                showLabels={true}
              />
            </div>

            {visibleToGroups.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-1">Accessible by:</p>
                <ul className="space-y-1">
                  {visibleToGroups.map((group, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Users className="h-3 w-3" />
                      <span>{group.name} ({group.userCount} users)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
