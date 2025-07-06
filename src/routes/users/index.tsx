import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '~/components/layout/DashboardLayout';
import { Button } from '~/components/ui/Button';
import { useTRPC } from '~/trpc/react';
import { useAuthStore } from '~/stores/auth';
import { formatDate } from '~/lib/utils';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Mail, 
  Building, 
  Calendar,
  MoreVertical,
  LogIn
} from 'lucide-react';

function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);

  const trpc = useTRPC();
  const setAuth = useAuthStore((state) => state.setAuth);

  const getAllUsers = useQuery(trpc.getAllUsers.queryOptions({
    token: localStorage.getItem('auth-token') || '',
    page: currentPage,
    limit: 20,
    search: search || undefined,
  }));

  const impersonateUser = useMutation(trpc.impersonateUser.mutationOptions());

  useEffect(() => {
    if (getAllUsers.data) {
      setUsers(getAllUsers.data.users);
      setTotalPages(getAllUsers.data.totalPages);
    }
  }, [getAllUsers.data]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    getAllUsers.refetch();
  };

  const handleImpersonate = async (targetUserId: number) => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;

    try {
      const result = await impersonateUser.mutateAsync({
        token,
        targetUserId,
      });

      // Update auth store with impersonated user
      setAuth(result.token, result.user);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to impersonate user:', error);
    }
  };

  const getStatusBadge = (user: any) => {
    if (!user.isActive) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    if (!user.isEmailVerified) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Unverified</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  if (getAllUsers.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">
              Manage all users in the system and their access permissions.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or company..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Users ({getAllUsers.data?.totalCount || 0})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                          <span className="text-sm font-medium text-gray-700">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          {user.company && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {user.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{user._count.userRoomAccess} data rooms</div>
                        <div>{user._count.createdRooms} created</div>
                        {user.lastLoginAt && (
                          <div>Last login: {formatDate(user.lastLoginAt)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowImpersonateModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Impersonate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Impersonate Confirmation Modal */}
        {showImpersonateModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm User Impersonation
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to impersonate <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>? 
                This action will be logged for security purposes.
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => handleImpersonate(selectedUser.id)}
                  disabled={impersonateUser.isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {impersonateUser.isLoading ? 'Impersonating...' : 'Confirm Impersonation'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowImpersonateModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute('/users/')({
  component: UsersPage,
});
