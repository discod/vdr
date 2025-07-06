import { useState, useEffect } from "react";
import { 
  X, 
  FolderOpen, 
  Upload, 
  Users, 
  Eye, 
  MessageSquare, 
  Star,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useUser } from "~/stores/auth";

interface WelcomeScreenProps {
  userRole?: string;
  onClose: () => void;
  onGetStarted?: () => void;
}

interface RoleCapability {
  icon: any;
  title: string;
  description: string;
  color: string;
}

export function WelcomeScreen({ userRole = "VIEWER", onClose, onGetStarted }: WelcomeScreenProps) {
  const user = useUser();
  const [currentStep, setCurrentStep] = useState(0);

  const getRoleCapabilities = (role: string): RoleCapability[] => {
    const baseCapabilities = [
      {
        icon: Eye,
        title: "View Files",
        description: "Browse and view all files you have access to",
        color: "text-blue-600 bg-blue-100",
      },
      {
        icon: Star,
        title: "Favorite Files",
        description: "Mark important files as favorites for quick access",
        color: "text-yellow-600 bg-yellow-100",
      },
      {
        icon: MessageSquare,
        title: "Ask Questions",
        description: "Ask questions about documents through our Q&A system",
        color: "text-green-600 bg-green-100",
      },
    ];

    switch (role) {
      case "ROOM_OWNER":
      case "ADMIN":
        return [
          ...baseCapabilities,
          {
            icon: Upload,
            title: "Upload & Organize",
            description: "Upload files and organize them into folders",
            color: "text-purple-600 bg-purple-100",
          },
          {
            icon: Users,
            title: "Manage Users",
            description: "Invite users and manage their permissions",
            color: "text-orange-600 bg-orange-100",
          },
        ];
      case "CONTRIBUTOR":
        return [
          ...baseCapabilities,
          {
            icon: Upload,
            title: "Upload & Organize",
            description: "Upload files and organize them into folders",
            color: "text-purple-600 bg-purple-100",
          },
        ];
      case "AUDITOR":
        return [
          ...baseCapabilities,
          {
            icon: FolderOpen,
            title: "Audit Access",
            description: "View all files and activity logs for compliance",
            color: "text-gray-600 bg-gray-100",
          },
        ];
      default:
        return baseCapabilities;
    }
  };

  const capabilities = getRoleCapabilities(userRole);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ROOM_OWNER": return "Room Owner";
      case "ADMIN": return "Administrator";
      case "CONTRIBUTOR": return "Contributor";
      case "AUDITOR": return "Auditor";
      default: return "Viewer";
    }
  };

  const getWelcomeMessage = (role: string) => {
    switch (role) {
      case "ROOM_OWNER":
        return "You have full control over this data room. You can manage all aspects including users, settings, and content.";
      case "ADMIN":
        return "You can manage this data room on behalf of the owner, including uploading files and managing users.";
      case "CONTRIBUTOR":
        return "You can upload and organize documents, as well as participate in Q&A discussions.";
      case "AUDITOR":
        return "You have read-only access to all content and can view audit logs for compliance purposes.";
      default:
        return "You can view files, ask questions, and interact with content as permitted by the room settings.";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to VaultSpace! 👋
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Hello {user?.firstName}, you're joining as a {getRoleDisplayName(userRole)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Role explanation */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your Role: {getRoleDisplayName(userRole)}
            </h3>
            <p className="text-gray-600">{getWelcomeMessage(userRole)}</p>
          </div>

          {/* Capabilities */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Here's what you can do:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capabilities.map((capability, index) => {
                const Icon = capability.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${capability.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{capability.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{capability.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Look for info icons (ℹ️) throughout the interface for helpful tips</li>
              <li>• Use the folder tree on the left to navigate between folders</li>
              <li>• Hover over restriction icons to understand file permissions</li>
              <li>• All your actions are logged for security and compliance</li>
            </ul>
          </div>

          {/* Security notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">🔒 Security Notice</h4>
            <p className="text-sm text-amber-800">
              This is a secure virtual data room. All files may be watermarked with your identity, 
              and all activities are monitored and logged. Please handle all information with appropriate care.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              onChange={(e) => {
                if (e.target.checked) {
                  localStorage.setItem('vdr-welcome-seen', 'true');
                }
              }}
            />
            <span>Don't show this again</span>
          </label>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              I'll explore on my own
            </Button>
            <Button 
              onClick={() => {
                onGetStarted?.();
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to check if user should see welcome screen
export function useWelcomeScreen() {
  const [shouldShow, setShouldShow] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user) {
      const hasSeenWelcome = localStorage.getItem('vdr-welcome-seen');
      const isNewUser = !hasSeenWelcome;
      setShouldShow(isNewUser);
    }
  }, [user]);

  const markAsShown = () => {
    localStorage.setItem('vdr-welcome-seen', 'true');
    setShouldShow(false);
  };

  return { shouldShow, markAsShown };
}
