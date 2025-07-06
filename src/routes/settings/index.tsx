import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { SystemSettings } from "~/components/settings/SystemSettings";
import { UserPreferences } from "~/components/settings/UserPreferences";
import { DataRoomSettings } from "~/components/settings/DataRoomSettings";
import { useTRPC } from "~/trpc/react";
import { Settings, Shield, User, Database } from "lucide-react";

function SettingsPage() {
  const [activeSection, setActiveSection] = useState<"user" | "system" | "dataroom">("user");
  const [selectedDataRoomId, setSelectedDataRoomId] = useState<number | null>(null);
  const trpc = useTRPC();

  const { data: currentUser, isLoading: userLoading } = useQuery(
    trpc.getCurrentUser.queryOptions({
      token: localStorage.getItem("auth-token") || "",
    })
  );

  const { data: dataRooms, isLoading: roomsLoading } = useQuery(
    trpc.getDataRooms.queryOptions({
      token: localStorage.getItem("auth-token") || "",
    })
  );

  // Check if user is super admin (can access any data room)
  const isSuperAdmin = dataRooms?.some((room: any) => 
    room.userPermissions?.canEdit && room.userPermissions?.canInvite && room.userPermissions?.canManageQA
  ) || false;

  // Get data rooms where user has admin permissions
  const adminDataRooms = dataRooms?.filter((room: any) => 
    room.userPermissions?.canEdit || room.userPermissions?.canInvite
  ) || [];

  if (userLoading || roomsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const sections = [
    { id: "user", label: "User Preferences", icon: User, available: true },
    { id: "dataroom", label: "Data Room Settings", icon: Database, available: adminDataRooms.length > 0 },
    { id: "system", label: "System Settings", icon: Shield, available: isSuperAdmin },
  ].filter(section => section.available);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id as any);
                      if (section.id === "dataroom" && adminDataRooms.length > 0) {
                        setSelectedDataRoomId(adminDataRooms[0].id);
                      }
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.label}
                  </button>
                );
              })}
            </nav>

            {/* Data Room Selector */}
            {activeSection === "dataroom" && adminDataRooms.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Select Data Room</h3>
                <div className="space-y-2">
                  {adminDataRooms.map((room: any) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedDataRoomId(room.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                        selectedDataRoomId === room.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {activeSection === "user" && <UserPreferences />}
            
            {activeSection === "system" && isSuperAdmin && <SystemSettings />}
            
            {activeSection === "dataroom" && selectedDataRoomId && (
              <DataRoomSettings dataRoomId={selectedDataRoomId} />
            )}

            {activeSection === "dataroom" && adminDataRooms.length === 0 && (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Rooms</h3>
                <p className="text-gray-600">
                  You don't have administrative access to any data rooms.
                </p>
              </div>
            )}

            {activeSection === "system" && !isSuperAdmin && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">
                  You don't have permission to access system settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});
