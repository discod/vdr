import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { DataRoomContent } from "~/components/data-rooms/DataRoomContent";
import { useIsAuthenticated, useToken } from "~/stores/auth";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/data-rooms/$roomId/")({
  component: DataRoomDetailPage,
});

function DataRoomDetailPage() {
  const { roomId } = Route.useParams();
  const isAuthenticated = useIsAuthenticated();
  const token = useToken();
  const trpc = useTRPC();

  if (!isAuthenticated || !token) {
    return <Navigate to="/auth/login" />;
  }

  const dataRoomQuery = useQuery(trpc.getDataRoom.queryOptions({ 
    authToken: token, 
    roomId: parseInt(roomId) 
  }));

  if (dataRoomQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (dataRoomQuery.error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this data room or it doesn't exist.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const dataRoom = dataRoomQuery.data;

  return (
    <DashboardLayout>
      <DataRoomContent dataRoom={dataRoom} />
    </DashboardLayout>
  );
}
