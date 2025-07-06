import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '~/components/layout/DashboardLayout';
import { AnalyticsDashboard } from '~/components/analytics/AnalyticsDashboard';

function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">
              View comprehensive analytics across all data rooms and user activities.
            </p>
          </div>
        </div>

        <AnalyticsDashboard />
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute('/analytics/')({
  component: AnalyticsPage,
});
