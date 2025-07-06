import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Send, Lock } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataRoomId: number;
  dataRoomName: string;
  folderId?: number;
  folderName?: string;
}

export function AccessRequestModal({
  isOpen,
  onClose,
  dataRoomId,
  dataRoomName,
  folderId,
  folderName,
}: AccessRequestModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = useToken();
  const trpc = useTRPC();

  const requestAccess = useMutation(trpc.requestAccess.mutationOptions());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    try {
      await requestAccess.mutateAsync({
        token,
        dataRoomId,
        folderId,
        reason: reason.trim() || undefined,
      });

      // Show success message
      alert("Access request submitted successfully! You will be notified when it's reviewed.");
      onClose();
      setReason("");
    } catch (error: any) {
      alert(error.message || "Failed to submit access request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Request Access</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              You are requesting access to:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{dataRoomName}</p>
              {folderName && (
                <p className="text-sm text-gray-600">Folder: {folderName}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for access (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please explain why you need access to this content..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
