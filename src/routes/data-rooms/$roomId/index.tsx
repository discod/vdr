import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { DataRoomContent } from "~/components/data-rooms/DataRoomContent";
import { AccessRequestModal } from "~/components/data-rooms/AccessRequestModal";
import { Button } from "~/components/ui/Button";
import { useIsAuthenticated, useToken } from "~/stores/auth";
import { useTRPC } from "~/trpc/react";
import { Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/data-rooms/$roomId/")({
  component: DataRoomDetailPage,
});

function DataRoomDetailPage() {
  const { roomId } = Route.useParams();
  const isAuthenticated = useIsAuthenticated();
  const token = useToken();
  const trpc = useTRPC();
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);

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
    const errorMessage = dataRoomQuery.error.message;
    const isAccessDenied = errorMessage.includes("Access denied") || errorMessage.includes("FORBIDDEN");
    
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isAccessDenied ? "Access Restricted" : "Data Room Not Found"}
            </h2>
            <p className="text-gray-600 mb-6">
              {isAccessDenied 
                ? "You don't have permission to access this data room. You can request access from the administrator."
                : "The data room you're looking for doesn't exist or has been removed."
              }
            </p>
            
            {isAccessDenied && (
              <div className="space-y-4">
                <Button
                  onClick={() => setShowAccessRequestModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Request Access
                </Button>
                <p className="text-sm text-gray-500">
                  The administrator will be notified of your request
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Access Request Modal */}
        <AccessRequestModal
          isOpen={showAccessRequestModal}
          onClose={() => setShowAccessRequestModal(false)}
          dataRoomId={parseInt(roomId)}
          dataRoomName={`Data Room #${roomId}`}
        />
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
