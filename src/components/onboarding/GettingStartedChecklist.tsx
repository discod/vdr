import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Circle, 
  Upload, 
  Users, 
  Settings, 
  FolderPlus, 
  MessageSquare,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "~/components/ui/Button";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface GettingStartedChecklistProps {
  dataRoom: any;
  onAction?: (actionType: string) => void;
  onClose?: () => void;
  className?: string;
}

export function GettingStartedChecklist({ 
  dataRoom, 
  onAction, 
  onClose, 
  className = "" 
}: GettingStartedChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if checklist was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(`checklist-dismissed-${dataRoom.id}`);
    setIsDismissed(!!dismissed);
  }, [dataRoom.id]);

  const checklistItems: ChecklistItem[] = [
    {
      id: "upload-files",
      title: "Upload your first files",
      description: "Add documents to your data room to get started",
      icon: Upload,
      completed: (dataRoom._count?.files || 0) > 0,
      action: () => onAction?.("upload"),
      actionLabel: "Upload Files",
    },
    {
      id: "create-folders",
      title: "Organize with folders",
      description: "Create folders to organize your documents logically",
      icon: FolderPlus,
      completed: (dataRoom._count?.folders || 0) > 0,
      action: () => onAction?.("create-folder"),
      actionLabel: "Create Folder",
    },
    {
      id: "invite-users",
      title: "Invite team members",
      description: "Add users who need access to your data room",
      icon: Users,
      completed: (dataRoom._count?.userAccess || 0) > 1, // More than just the owner
      action: () => onAction?.("invite"),
      actionLabel: "Invite Users",
    },
    {
      id: "configure-settings",
      title: "Configure security settings",
      description: "Set up watermarks, download restrictions, and expiration",
      icon: Settings,
      completed: dataRoom.watermarkEnabled || !dataRoom.allowDownload || !!dataRoom.expiresAt,
      action: () => onAction?.("settings"),
      actionLabel: "Configure Settings",
    },
    {
      id: "enable-qa",
      title: "Enable Q&A system",
      description: "Allow users to ask questions about documents",
      icon: MessageSquare,
      completed: dataRoom.qaEnabled !== false, // Assuming qaEnabled field exists
      action: () => onAction?.("qa-settings"),
      actionLabel: "Enable Q&A",
    },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;

  const handleDismiss = () => {
    localStorage.setItem(`checklist-dismissed-${dataRoom.id}`, 'true');
    setIsDismissed(true);
    onClose?.();
  };

  if (isDismissed || isComplete) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">
                {completedCount}/{totalCount}
              </span>
            </div>
            {completedCount > 0 && (
              <div className="absolute -top-1 -right-1">
                <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Getting Started
            </h3>
            <p className="text-sm text-gray-600">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ChevronRight 
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} 
          />
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {checklistItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                  item.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="mt-0.5">
                  {item.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    item.completed ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {item.title}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    item.completed ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                </div>
                
                {!item.completed && item.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={item.action}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    {item.actionLabel}
                  </Button>
                )}
                
                {item.completed && (
                  <div className="text-green-600">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}
          
          {isComplete && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium text-green-900 mb-1">
                Congratulations! 🎉
              </h4>
              <p className="text-sm text-green-700">
                Your data room is fully set up and ready to use.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
