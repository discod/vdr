import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Eye, 
  Download, 
  Upload, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  Filter
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { formatDate, formatFileSize } from "~/lib/utils";

interface AnalyticsDashboardProps {
  dataRoomId?: number;
}

export function AnalyticsDashboard({ dataRoomId }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });
  const [analytics, setAnalytics] = useState<any>(null);

  const trpc = useTRPC();
  const getAnalytics = useQuery(trpc.getAnalytics.queryOptions({
    token: localStorage.getItem('auth-token') || '',
    dataRoomId,
    dateRange,
  }));

  useEffect(() => {
    if (getAnalytics.data) {
      setAnalytics(getAnalytics.data);
    }
  }, [getAnalytics.data]);

  const processActivityData = (activities: any[]) => {
    const actionCounts = activities.reduce((acc: any, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + activity._count.action;
      return acc;
    }, {});

    return Object.entries(actionCounts).map(([action, count]) => ({
      action,
      count,
    }));
  };

  const processDailyActivity = (activities: any[]) => {
    const dailyData = activities.reduce((acc: any, activity) => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  if (getAnalytics.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
        <p className="text-gray-600">Analytics data will appear here once there's activity.</p>
      </div>
    );
  }

  const activityData = processActivityData(analytics.activityOverview);
  const dailyData = processDailyActivity(analytics.dailyActivity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            {dataRoomId ? 'Data Room Analytics' : 'System Analytics'}
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {activityData.find(a => a.action === 'VIEW')?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">
                {activityData.find(a => a.action === 'DOWNLOAD')?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Upload className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Uploads</p>
              <p className="text-2xl font-bold text-gray-900">
                {activityData.find(a => a.action === 'UPLOAD')?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.userActivity.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Overview */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Overview</h4>
          <div className="space-y-3">
            {activityData.map((item) => (
              <div key={item.action} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">{item.action}</span>
                </div>
                <span className="text-sm text-gray-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Activity Trend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Activity</h4>
          <div className="space-y-2">
            {dailyData.slice(-7).map((item) => (
              <div key={item.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{formatDate(new Date(item.date))}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${Math.max(10, (item.count / Math.max(...dailyData.map(d => d.count))) * 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Files and Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Files */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Most Viewed Files</h4>
          <div className="space-y-3">
            {analytics.topViewedFiles.slice(0, 5).map((item: any) => (
              <div key={item.fileId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.file?.name || 'Unknown File'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.file?.size && formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{item._count.fileId} views</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Users */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Most Active Users</h4>
          <div className="space-y-3">
            {analytics.userActivity.slice(0, 5).map((item: any) => (
              <div key={item.userId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      {item.user?.firstName?.[0]}{item.user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.user?.firstName} {item.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{item.user?.email}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{item._count.userId} actions</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
