import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { DataRoomsList } from "~/components/data-rooms/DataRoomsList";
import { useIsAuthenticated, useToken } from "~/stores/auth";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const isAuthenticated = useIsAuthenticated();
  const token = useToken();
  const trpc = useTRPC();

  if (!isAuthenticated || !token) {
    return <Navigate to="/auth/login" />;
  }

  const dataRoomsQuery = useQuery(trpc.getDataRooms.queryOptions({ authToken: token }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Rooms</h1>
            <p className="text-gray-600">Manage your virtual data rooms</p>
          </div>
        </div>

        <DataRoomsList 
          dataRooms={dataRoomsQuery.data?.dataRooms || []}
          isLoading={dataRoomsQuery.isLoading}
          error={dataRoomsQuery.error}
        />
      </div>
    </DashboardLayout>
  );
}
