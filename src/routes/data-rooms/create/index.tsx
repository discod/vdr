import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { CreateDataRoomForm } from "~/components/data-rooms/CreateDataRoomForm";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { useIsAuthenticated, useToken } from "~/stores/auth";

export const Route = createFileRoute("/data-rooms/create/")({
  component: CreateDataRoomPage,
});

function CreateDataRoomPage() {
  const isAuthenticated = useIsAuthenticated();
  const token = useToken();
  const navigate = useNavigate();

  if (!isAuthenticated || !token) {
    return <Navigate to="/auth/login" />;
  }

  const handleSuccess = (dataRoom: any) => {
    navigate({ to: `/data-rooms/${dataRoom.id}` });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Data Room</h1>
          <p className="text-gray-600">Set up a new virtual data room for secure document sharing</p>
        </div>

        <CreateDataRoomForm onSuccess={handleSuccess} />
      </div>
    </DashboardLayout>
  );
}
