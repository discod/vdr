import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Eye, 
  Download, 
  Upload, 
  Edit, 
  MessageSquare,
  BarChart3,
  Crown,
  Star,
  UserCheck,
  UserX,
  MoreVertical,
  Mail,
  Building,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";
import { Button } from "~/components/ui/Button";
import { formatDate } from "~/lib/utils";

interface UserManagementProps {
  dataRoomId: number;
  userPermissions: any;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  title?: string;
  role: string;
  canView: boolean;
  canDownload: boolean;
  canPrint: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canInvite: boolean;
  canManageQA: boolean;
  canViewAudit: boolean;
  canManageUsers: boolean;
  canManageGroups: boolean;
  canManageRoom: boolean;
  ipWhitelist: string[];
  allowedCountries: string[];
  expiresAt?: string;
  createdAt: string;
}

interface UserGroup {
  id: number;
  name: string;
  description?: string;
  color?: string;
  memberships: Array<{
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      company?: string;
    };
  }>;
  _count: {
    memberships: number;
  };
}

// Helper component functions moved outside to avoid hooks issues
function UsersTab({ 
  users, 
  getRoleInfo, 
  canManageUser, 
  formatDate 
}: { 
  users: any[]; 
  getRoleInfo: (role: string) => any; 
  canManageUser: (user: any) => boolean;
  formatDate: (date: string) => string;
}) {
  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Access Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user: any) => {
              const roleInfo = getRoleInfo(user.role);
              const RoleIcon = roleInfo.icon;
              
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.company && (
                          <div className="text-xs text-gray-400">{user.company}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <RoleIcon className={`h-4 w-4 mr-2 ${roleInfo.color.split(' ')[0]}`} />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-1">
                      {user.canView && <Eye className="h-4 w-4 text-green-500" title="Can View" />}
                      {user.canDownload && <Download className="h-4 w-4 text-blue-500" title="Can Download" />}
                      {user.canUpload && <Upload className="h-4 w-4 text-purple-500" title="Can Upload" />}
                      {user.canEdit && <Edit className="h-4 w-4 text-orange-500" title="Can Edit" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canManageUser(user) && (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupsTab({ 
  groups, 
  expandedGroups, 
  setExpandedGroups 
}: { 
  groups: UserGroup[]; 
  expandedGroups: Set<number>; 
  setExpandedGroups: (groups: Set<number>) => void; 
}) {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {groups.map((group: UserGroup) => {
          const isExpanded = expandedGroups.has(group.id);
          
          return (
            <div key={group.id} className="border border-gray-200 rounded-lg">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedGroups);
                      if (isExpanded) {
                        newExpanded.delete(group.id);
                      } else {
                        newExpanded.add(group.id);
                      }
                      setExpandedGroups(newExpanded);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                  <div className={`w-3 h-3 rounded-full ${group.color || 'bg-gray-400'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-gray-500">{group.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    {group._count.memberships} members
                  </span>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-2">
                    {group.memberships.map((membership) => (
                      <div key={membership.user.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {membership.user.firstName?.[0]}{membership.user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {membership.user.firstName} {membership.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{membership.user.email}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PermissionsTab({ 
  users, 
  permissionCapabilities, 
  permissionView, 
  setPermissionView, 
  getRoleInfo, 
  canManageUser, 
  handlePermissionToggle 
}: { 
  users: any[]; 
  permissionCapabilities: any[]; 
  permissionView: "matrix" | "list"; 
  setPermissionView: (view: "matrix" | "list") => void; 
  getRoleInfo: (role: string) => any; 
  canManageUser: (user: any) => boolean; 
  handlePermissionToggle: (userId: number, permission: string, value: boolean) => void; 
}) {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Permissions Matrix</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={permissionView === "matrix" ? "default" : "outline"}
            size="sm"
            onClick={() => setPermissionView("matrix")}
          >
            Matrix View
          </Button>
          <Button
            variant={permissionView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setPermissionView("list")}
          >
            List View
          </Button>
        </div>
      </div>

      {permissionView === "matrix" ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  User
                </th>
                {permissionCapabilities.map((capability) => {
                  const Icon = capability.icon;
                  return (
                    <th key={capability.key} className="px-2 py-3 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center space-y-1">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 leading-tight">
                          {capability.label}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-r border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{getRoleInfo(user.role).label}</div>
                      </div>
                    </div>
                  </td>
                  {permissionCapabilities.map((capability) => (
                    <td key={capability.key} className="px-2 py-3 text-center border-r border-gray-200">
                      <input
                        type="checkbox"
                        checked={user[capability.key] || false}
                        onChange={(e) => handlePermissionToggle(user.id, capability.key, e.target.checked)}
                        disabled={!canManageUser(user)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {permissionCapabilities.map((capability) => {
            const Icon = capability.icon;
            const usersWithPermission = users.filter((user: any) => user[capability.key]);
            
            return (
              <div key={capability.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{capability.label}</h4>
                    <p className="text-xs text-gray-500">{capability.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {usersWithPermission.map((user: any) => (
                    <span
                      key={user.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {user.firstName} {user.lastName}
                    </span>
                  ))}
                  {usersWithPermission.length === 0 && (
                    <span className="text-sm text-gray-500">No users have this permission</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function UserManagement({ dataRoomId, userPermissions }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<"users" | "groups" | "permissions">("users");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [permissionView, setPermissionView] = useState<"matrix" | "list">("matrix");

  const token = useToken();
  const trpc = useTRPC();

  // Fetch data room details with users
  const dataRoomQuery = useQuery(
    trpc.getDataRoom.queryOptions({
      authToken: token!,
      roomId: dataRoomId,
    })
  );

  // Fetch user groups
  const userGroupsQuery = useQuery(
    trpc.getUserGroups.queryOptions({
      token: token!,
      dataRoomId,
    })
  );

  const users = dataRoomQuery.data?.userAccess || [];
  const groups = userGroupsQuery.data || [];

  // Permission management mutations
  const updateUserPermissions = useMutation(trpc.updateUserPermissions.mutationOptions());
  const createUserGroup = useMutation(trpc.createUserGroup.mutationOptions());
  const manageGroupMembership = useMutation(trpc.manageUserGroupMembership.mutationOptions());

  const permissionCapabilities = [
    { key: 'canView', label: 'View Files', icon: Eye, description: 'Can view documents and folders' },
    { key: 'canDownload', label: 'Download', icon: Download, description: 'Can download documents' },
    { key: 'canUpload', label: 'Upload', icon: Upload, description: 'Can upload new documents' },
    { key: 'canEdit', label: 'Edit', icon: Edit, description: 'Can modify and delete documents' },
    { key: 'canInvite', label: 'Invite Users', icon: UserPlus, description: 'Can invite new users' },
    { key: 'canManageQA', label: 'Manage Q&A', icon: MessageSquare, description: 'Can answer questions and manage Q&A' },
    { key: 'canViewAudit', label: 'View Audit', icon: BarChart3, description: 'Can view audit logs and analytics' },
    { key: 'canManageUsers', label: 'Manage Users', icon: Users, description: 'Can modify user permissions' },
    { key: 'canManageGroups', label: 'Manage Groups', icon: Shield, description: 'Can create and manage user groups' },
    { key: 'canManageRoom', label: 'Manage Room', icon: Settings, description: 'Can modify room settings and branding' },
  ];

  const roleHierarchy = [
    { 
      role: 'ROOM_OWNER', 
      label: 'Room Owner', 
      icon: Crown, 
      color: 'text-purple-600 bg-purple-100',
      description: 'Full control over all settings, users, and content' 
    },
    { 
      role: 'ADMIN', 
      label: 'Admin', 
      icon: Star, 
      color: 'text-blue-600 bg-blue-100',
      description: 'Manages the room on behalf of the owner' 
    },
    { 
      role: 'CONTRIBUTOR', 
      label: 'Contributor', 
      icon: Upload, 
      color: 'text-green-600 bg-green-100',
      description: 'Can upload documents and organize folders' 
    },
    { 
      role: 'VIEWER', 
      label: 'Viewer', 
      icon: Eye, 
      color: 'text-gray-600 bg-gray-100',
      description: 'Can only view files as permitted' 
    },
    { 
      role: 'AUDITOR', 
      label: 'Auditor', 
      icon: BarChart3, 
      color: 'text-orange-600 bg-orange-100',
      description: 'Read-only access to everything including activity logs' 
    },
  ];

  const getRoleInfo = (role: string) => {
    return roleHierarchy.find(r => r.role === role) || roleHierarchy[3]; // Default to VIEWER
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!token) return;
    
    try {
      await updateUserPermissions.mutateAsync({
        token,
        dataRoomId,
        userId,
        role: newRole as any,
      });
      
      toast.success('User role updated successfully');
      dataRoomQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const handlePermissionToggle = async (userId: number, permission: string, value: boolean) => {
    if (!token) return;
    
    try {
      await updateUserPermissions.mutateAsync({
        token,
        dataRoomId,
        userId,
        permissions: {
          [permission]: value,
        },
      });
      
      toast.success('Permission updated successfully');
      dataRoomQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permission');
    }
  };

  const canManageUser = (targetUser: any) => {
    // Room owners can manage everyone except other room owners
    if (userPermissions.role === 'ROOM_OWNER') {
      return targetUser.role !== 'ROOM_OWNER' || targetUser.id === userPermissions.userId;
    }
    
    // Admins can manage contributors, viewers, and auditors
    if (userPermissions.canManageUsers) {
      return !['ROOM_OWNER', 'ADMIN'].includes(targetUser.role);
    }
    
    return false;
  };

  const tabs = [
    { id: "users", label: "Users", icon: Users, count: users.length },
    { id: "groups", label: "Groups", icon: Shield, count: groups.length },
    { id: "permissions", label: "Permissions Matrix", icon: Settings, count: null },
  ];

  if (!userPermissions.canManageUsers && userPermissions.role !== 'ROOM_OWNER') {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage users in this data room.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600">
            Manage users, roles, and permissions for this data room
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {(userPermissions.canInvite || userPermissions.canManageUsers) && (
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Users
            </Button>
          )}
          
          {(userPermissions.canManageGroups || userPermissions.role === 'ROOM_OWNER') && (
            <Button
              variant="outline"
              onClick={() => setShowGroupModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === "users" && (
          <UsersTab 
            users={users} 
            getRoleInfo={getRoleInfo} 
            canManageUser={canManageUser} 
            formatDate={formatDate} 
          />
        )}
        {activeTab === "groups" && (
          <GroupsTab 
            groups={groups} 
            expandedGroups={expandedGroups} 
            setExpandedGroups={setExpandedGroups} 
          />
        )}
        {activeTab === "permissions" && (
          <PermissionsTab 
            users={users} 
            permissionCapabilities={permissionCapabilities} 
            permissionView={permissionView} 
            setPermissionView={setPermissionView} 
            getRoleInfo={getRoleInfo} 
            canManageUser={canManageUser} 
            handlePermissionToggle={handlePermissionToggle} 
          />
        )}
      </div>
    </div>
  );
}
