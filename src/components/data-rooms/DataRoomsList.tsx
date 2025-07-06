import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  FolderOpen, 
  Users, 
  Calendar, 
  MoreVertical,
  Filter,
  Grid,
  List
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { formatDate } from "~/lib/utils";

interface DataRoom {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  userRole: string;
  permissions: any;
  _count: {
    files: number;
    folders: number;
    userAccess: number;
  };
}

interface DataRoomsListProps {
  dataRooms: DataRoom[];
  isLoading: boolean;
  error: any;
}

export function DataRoomsList({ dataRooms, isLoading, error }: DataRoomsListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredRooms = dataRooms.filter((room) => {
    if (filterType !== "all" && room.type !== filterType) return false;
    if (filterStatus !== "all" && room.status !== filterStatus) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading data rooms: {error.message}</p>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No data rooms found</h3>
        <p className="text-gray-600 mb-6">Get started by creating your first data room.</p>
        <Link to="/data-rooms/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Create Data Room
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and view controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="M&A">M&A</option>
              <option value="FUNDRAISING">Fundraising</option>
              <option value="IPO">IPO</option>
              <option value="AUDIT">Audit</option>
              <option value="LEGAL">Legal</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Data rooms grid/list */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <DataRoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Files</div>
              <div className="col-span-2">Users</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredRooms.map((room) => (
              <DataRoomRow key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DataRoomCard({ room }: { room: DataRoom }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "ARCHIVED": return "bg-gray-100 text-gray-800";
      case "EXPIRED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "M&A": return "bg-blue-100 text-blue-800";
      case "FUNDRAISING": return "bg-purple-100 text-purple-800";
      case "IPO": return "bg-indigo-100 text-indigo-800";
      case "AUDIT": return "bg-yellow-100 text-yellow-800";
      case "LEGAL": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Link to={`/data-rooms/${room.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{room.name}</h3>
            {room.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(room.type)}`}>
            {room.type}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
            {room.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <FolderOpen className="h-4 w-4 mr-1" />
            {room._count.files} files
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {room._count.userAccess} users
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(room.createdAt)}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Created by {room.creator.firstName} {room.creator.lastName}
          </p>
          <p className="text-xs text-gray-400">Your role: {room.userRole}</p>
        </div>
      </div>
    </Link>
  );
}

function DataRoomRow({ room }: { room: DataRoom }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "ARCHIVED": return "bg-gray-100 text-gray-800";
      case "EXPIRED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Link to={`/data-rooms/${room.id}`}>
      <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4">
            <div className="flex items-center">
              <FolderOpen className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">{room.name}</p>
                <p className="text-xs text-gray-500">{room.creator.firstName} {room.creator.lastName}</p>
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {room.type}
            </span>
          </div>
          <div className="col-span-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
              {room.status}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-900">{room._count.files}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-900">{room._count.userAccess}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
