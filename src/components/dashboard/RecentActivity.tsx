import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  FileText, 
  Upload, 
  MessageSquare, 
  Users, 
  Eye,
  Clock,
  ChevronRight
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";
import { formatDate } from "~/lib/utils";

interface RecentActivityProps {
  dataRoomId?: number;
  limit?: number;
}

export function RecentActivity({ dataRoomId, limit = 10 }: RecentActivityProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const token = useToken();
  const trpc = useTRPC();

  const getRecentActivity = useQuery(trpc.getRecentActivity.queryOptions({
    token: token || '',
    limit,
    dataRoomId,
  }));

  useEffect(() => {
    if (getRecentActivity.data) {
      setActivities(getRecentActivity.data);
    }
  }, [getRecentActivity.data]);

  const getActivityIcon = (action: string, resource: string) => {
    switch (action) {
      case "UPLOAD":
        return <Upload className="h-4 w-4 text-blue-600" />;
      case "CREATE":
        if (resource === "QUESTION") {
          return <MessageSquare className="h-4 w-4 text-green-600" />;
        }
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "ANSWER":
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case "INVITE":
        return <Users className="h-4 w-4 text-orange-600" />;
      case "VIEW":
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "UPLOAD":
        return "bg-blue-50 border-blue-200";
      case "CREATE":
        return "bg-purple-50 border-purple-200";
      case "ANSWER":
        return "bg-green-50 border-green-200";
      case "INVITE":
        return "bg-orange-50 border-orange-200";
      case "VIEW":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (getRecentActivity.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
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
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        {activities.length > 0 && (
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.action)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.action, activity.resource)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </span>
                  {activity.dataRoom && !dataRoomId && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {activity.dataRoom.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
