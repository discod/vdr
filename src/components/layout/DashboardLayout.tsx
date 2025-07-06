import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { 
  FolderOpen, 
  Plus, 
  Settings, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Clock,
  Shield,
  Info
} from "lucide-react";
import { useAuthStore, useUser } from "~/stores/auth";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";
import { WelcomeScreen, useWelcomeScreen } from "~/components/onboarding/WelcomeScreen";
import { toast } from "react-hot-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const user = useUser();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const { shouldShow: shouldShowWelcome, markAsShown } = useWelcomeScreen();

  // Session timeout management (30 minutes = 1800 seconds)
  useEffect(() => {
    const SESSION_DURATION = 30 * 60; // 30 minutes in seconds
    const WARNING_TIME = 5 * 60; // Show warning 5 minutes before expiry
    
    let timeLeft = SESSION_DURATION;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setSessionTimeLeft(timeLeft);
      
      if (timeLeft === WARNING_TIME && !showSessionWarning) {
        setShowSessionWarning(true);
        toast((t) => (
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-medium">Session expiring soon</p>
              <p className="text-sm text-gray-600">Your session will expire in 5 minutes</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                toast.dismiss(t.id);
                // Refresh session logic here
                timeLeft = SESSION_DURATION;
                setShowSessionWarning(false);
              }}
              className="ml-auto"
            >
              Extend
            </Button>
          </div>
        ), {
          duration: 10000,
          icon: '⏰',
        });
      }
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        handleLogout();
        toast.error("Session expired. Please log in again.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showSessionWarning, clearAuth]);

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/auth/login" });
  };

  // Enhanced navigation with role-based visibility
  const getNavigationItems = () => {
    const baseItems = [
      { 
        name: "Data Rooms", 
        href: "/dashboard", 
        icon: FolderOpen,
        tooltip: "Browse and manage your data rooms",
        show: true
      },
      { 
        name: "Search", 
        href: "/search", 
        icon: Search,
        tooltip: "Search across all accessible files and data rooms",
        show: true
      },
    ];

    const adminItems = [
      { 
        name: "Analytics", 
        href: "/analytics", 
        icon: BarChart3,
        tooltip: "View system analytics and audit logs",
        show: user?.isSystemAdmin || false // Assuming this field exists
      },
      { 
        name: "Users", 
        href: "/users", 
        icon: Users,
        tooltip: "Manage system users and permissions",
        show: user?.isSystemAdmin || false
      },
      { 
        name: "Settings", 
        href: "/settings", 
        icon: Settings,
        tooltip: "Configure system settings and preferences",
        show: user?.isSystemAdmin || false
      },
    ];

    return [...baseItems, ...adminItems].filter(item => item.show);
  };

  const navigation = getNavigationItems();

  const formatSessionTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-blue-600">VaultSpace</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 pb-4">
            {navigation.map((item) => (
              <Tooltip key={item.name} content={item.tooltip} position="right">
                <Link
                  to={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              </Tooltip>
            ))}
          </nav>
          
          {/* Mobile session indicator */}
          {sessionTimeLeft !== null && sessionTimeLeft < 300 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <Clock className="h-4 w-4" />
                <span>Session: {formatSessionTime(sessionTimeLeft)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-blue-600">VaultSpace</h1>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 pb-4">
            {navigation.map((item) => (
              <Tooltip key={item.name} content={item.tooltip} position="right">
                <Link
                  to={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  activeProps={{
                    className: "bg-blue-50 text-blue-700 border-blue-500"
                  }}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              </Tooltip>
            ))}
          </nav>
          
          {/* Desktop session indicator */}
          {sessionTimeLeft !== null && sessionTimeLeft < 600 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>Session expires in</span>
                </div>
                <span className="font-medium text-orange-600">
                  {formatSessionTime(sessionTimeLeft)}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-orange-500 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(0, (sessionTimeLeft / 600) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              
              {/* Enhanced Search */}
              <div className="hidden md:block ml-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files, data rooms..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const query = (e.target as HTMLInputElement).value;
                        if (query.trim()) {
                          navigate({ to: '/search', search: { q: query } });
                          toast.success(`Searching for "${query}"`);
                        }
                      }
                    }}
                    className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <Tooltip content="Press Enter to search across all accessible content">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Create button */}
              <Tooltip content="Create a new data room">
                <Link to="/data-rooms/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Room
                  </Button>
                </Link>
              </Tooltip>

              {/* Notifications */}
              <div className="relative">
                <Tooltip content="View notifications and recent activity">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </Button>
                </Tooltip>
                
                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification, index) => (
                          <div key={index} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tooltip content="View your profile and preferences">
                      <Link to="/settings">
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </Tooltip>
                    <Tooltip content="Sign out of your account">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Welcome Screen for new users */}
      {shouldShowWelcome && (
        <WelcomeScreen
          userRole={user?.role || "VIEWER"} // Assuming user has a role field
          onClose={markAsShown}
          onGetStarted={() => {
            markAsShown();
            navigate({ to: "/dashboard" });
            toast.success("Welcome to VaultSpace! Let's get you started.");
          }}
        />
      )}

      {/* Click outside handler for notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
