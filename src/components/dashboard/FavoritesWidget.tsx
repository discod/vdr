import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Star, 
  FileText, 
  Eye, 
  Download,
  ChevronRight,
  Folder
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";
import { formatDate, formatFileSize } from "~/lib/utils";
import { Button } from "~/components/ui/Button";

interface FavoritesWidgetProps {
  dataRoomId?: number;
  onFileSelect?: (fileId: number) => void;
}

export function FavoritesWidget({ dataRoomId, onFileSelect }: FavoritesWidgetProps) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const token = useToken();
  const trpc = useTRPC();

  const getUserFavorites = useQuery(trpc.getUserFavorites.queryOptions({
    token: token || '',
    dataRoomId,
  }));

  useEffect(() => {
    if (getUserFavorites.data) {
      setFavorites(getUserFavorites.data);
    }
  }, [getUserFavorites.data]);

  const handleFileView = (fileId: number) => {
    if (onFileSelect) {
      onFileSelect(fileId);
    }
  };

  if (getUserFavorites.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-medium text-gray-900">Favorites</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-medium text-gray-900">
            Favorites ({favorites.length})
          </h3>
        </div>
        {favorites.length > 0 && (
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No favorite files yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Star files to access them quickly
            </p>
          </div>
        ) : (
          favorites.slice(0, 5).map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="h-6 w-6 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {favorite.file.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(favorite.file.size)}</span>
                    <span>•</span>
                    <span>{formatDate(favorite.file.uploadedAt)}</span>
                    {!dataRoomId && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Folder className="h-3 w-3" />
                          <span className="truncate max-w-20">
                            {favorite.file.dataRoom.name}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileView(favorite.file.id)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {favorite.file.permissions.canDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
