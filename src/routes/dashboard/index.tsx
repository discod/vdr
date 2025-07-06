import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { DataRoomsList } from "~/components/data-rooms/DataRoomsList";
import { RecentActivity } from "~/components/dashboard/RecentActivity";
import { FavoritesWidget } from "~/components/dashboard/FavoritesWidget";
import { DocumentViewer } from "~/components/documents/DocumentViewer";
import { useIsAuthenticated, useToken } from "~/stores/auth";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const isAuthenticated = useIsAuthenticated();
  const token = useToken();
  const trpc = useTRPC();
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  if (!isAuthenticated || !token) {
    return <Navigate to="/auth/login" />;
  }

  const dataRoomsQuery = useQuery(trpc.getDataRooms.queryOptions({ authToken: token }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your data rooms and recent activity</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Data Rooms */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Your Data Rooms</h2>
              </div>
              <DataRoomsList 
                dataRooms={dataRoomsQuery.data?.dataRooms || []}
                isLoading={dataRoomsQuery.isLoading}
                error={dataRoomsQuery.error}
              />
            </div>
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-6">
            <RecentActivity limit={8} />
            <FavoritesWidget onFileSelect={setSelectedFileId} />
          </div>
        </div>

        {/* Document Viewer Modal */}
        {selectedFileId && (
          <DocumentViewer
            fileId={selectedFileId}
            onClose={() => setSelectedFileId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
