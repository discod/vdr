import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-600",
          iconBg: "bg-red-100",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: "text-orange-600",
          iconBg: "bg-orange-100",
          confirmButton: "bg-orange-600 hover:bg-orange-700 text-white",
        };
      case "info":
        return {
          icon: "text-blue-600",
          iconBg: "bg-blue-100",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      default:
        return {
          icon: "text-red-600",
          iconBg: "bg-red-100",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${styles.iconBg}`}>
              <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={styles.confirmButton}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
