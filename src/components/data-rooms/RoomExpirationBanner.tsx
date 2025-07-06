import { useState } from "react";
import { AlertTriangle, Calendar, X, Download, Archive } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { formatDate } from "~/lib/utils";

interface RoomExpirationBannerProps {
  dataRoom: {
    id: number;
    name: string;
    expiresAt: string | null;
    status: string;
  };
  userPermissions: {
    canEdit: boolean;
    canDownload: boolean;
  };
}

export function RoomExpirationBanner({ dataRoom, userPermissions }: RoomExpirationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!dataRoom.expiresAt || dismissed || dataRoom.status === "ARCHIVED") {
    return null;
  }

  const expiresAt = new Date(dataRoom.expiresAt);
  const now = new Date();
  const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const hasExpired = daysUntilExpiration <= 0;
  const isExpiringSoon = daysUntilExpiration <= 7 && daysUntilExpiration > 0;

  if (!hasExpired && !isExpiringSoon) {
    return null;
  }

  const getBannerStyle = () => {
    if (hasExpired) {
      return "bg-red-50 border-red-200 text-red-800";
    }
    if (daysUntilExpiration <= 3) {
      return "bg-red-50 border-red-200 text-red-800";
    }
    return "bg-yellow-50 border-yellow-200 text-yellow-800";
  };

  const getIconColor = () => {
    if (hasExpired || daysUntilExpiration <= 3) {
      return "text-red-600";
    }
    return "text-yellow-600";
  };

  const getMessage = () => {
    if (hasExpired) {
      return "This data room has expired and will be archived soon.";
    }
    if (daysUntilExpiration === 1) {
      return "This data room will expire tomorrow.";
    }
    return `This data room will expire in ${daysUntilExpiration} days.`;
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${getBannerStyle()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {hasExpired ? (
            <Archive className={`h-5 w-5 ${getIconColor()}`} />
          ) : (
            <AlertTriangle className={`h-5 w-5 ${getIconColor()}`} />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {hasExpired ? "Data Room Expired" : "Data Room Expiring Soon"}
          </h3>
          <div className="mt-1 text-sm">
            <p>{getMessage()}</p>
            <div className="flex items-center mt-2 space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                {hasExpired ? "Expired" : "Expires"} on {formatDate(dataRoom.expiresAt)}
              </span>
            </div>
          </div>
          
          {!hasExpired && (
            <div className="mt-3 flex space-x-3">
              {userPermissions.canDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Files
                </Button>
              )}
              {userPermissions.canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Extend Expiration
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="ml-auto flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
