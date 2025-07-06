import { useState } from "react";
import { 
  FolderOpen, 
  FileText, 
  Users, 
  MessageSquare, 
  Settings, 
  Download,
  Upload,
  Plus,
  MoreVertical,
  Calendar,
  Shield,
  Eye,
  X,
  Share2
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { formatDate, formatFileSize } from "~/lib/utils";
import { QASystem } from "~/components/data-rooms/QASystem";
import { AnalyticsDashboard } from "~/components/analytics/AnalyticsDashboard";
import { FileUpload } from "~/components/ui/FileUpload";
import { DocumentViewer } from "~/components/documents/DocumentViewer";
import { FileShareModal } from "~/components/ui/FileShareModal";

interface DataRoomContentProps {
  dataRoom: any;
}

export function DataRoomContent({ dataRoom }: DataRoomContentProps) {
  const [activeTab, setActiveTab] = useState<"files" | "users" | "qa" | "analytics">("files");
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const tabs = [
    { id: "files", label: "Files & Folders", icon: FolderOpen },
    { id: "users", label: "Users", icon: Users },
    { id: "qa", label: "Q&A", icon: MessageSquare },
    { id: "analytics", label: "Analytics", icon: Eye },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "ARCHIVED": return "bg-gray-100 text-gray-800";
      case "EXPIRED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{dataRoom.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dataRoom.status)}`}>
                {dataRoom.status}
              </span>
            </div>
            {dataRoom.description && (
              <p className="text-gray-600 mb-4">{dataRoom.description}</p>
            )}
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created {formatDate(dataRoom.createdAt)}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {dataRoom._count.userAccess} users
              </div>
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                {dataRoom._count.files} files
              </div>
              <div className="flex items-center">
                <FolderOpen className="h-4 w-4 mr-1" />
                {dataRoom._count.folders} folders
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {dataRoom.userPermissions.canUpload && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowFileUpload(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
            {dataRoom.userPermissions.canInvite && (
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Invite Users
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Security settings display */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1 text-gray-400" />
              <span className={dataRoom.watermarkEnabled ? "text-green-600" : "text-gray-500"}>
                Watermarks {dataRoom.watermarkEnabled ? "enabled" : "disabled"}
              </span>
            </div>
            <div className="flex items-center">
              <Download className="h-4 w-4 mr-1 text-gray-400" />
              <span className={dataRoom.allowDownload ? "text-green-600" : "text-red-600"}>
                Downloads {dataRoom.allowDownload ? "allowed" : "restricted"}
              </span>
            </div>
            {dataRoom.expiresAt && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                <span className="text-orange-600">
                  Expires {formatDate(dataRoom.expiresAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "files" && <FilesTab dataRoom={dataRoom} selectedFileId={selectedFileId} setSelectedFileId={setSelectedFileId} showFileUpload={showFileUpload} setShowFileUpload={setShowFileUpload} />}
          {activeTab === "users" && <UsersTab dataRoom={dataRoom} />}
          {activeTab === "qa" && <QATab dataRoom={dataRoom} />}
          {activeTab === "analytics" && <AnalyticsTab dataRoom={dataRoom} />}
        </div>
      </div>
    </div>
  );
}

function FilesTab({ dataRoom, selectedFileId, setSelectedFileId, showFileUpload, setShowFileUpload }: { 
  dataRoom: any;
  selectedFileId: number | null;
  setSelectedFileId: (id: number | null) => void;
  showFileUpload: boolean;
  setShowFileUpload: (show: boolean) => void;
}) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<{ id: number; name: string } | null>(null);

  return (
    <div className="space-y-4">
      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFileUpload(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FileUpload
              dataRoomId={dataRoom.id}
              onUploadComplete={() => {
                setShowFileUpload(false);
                // Refresh the page or refetch data
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {/* File Share Modal */}
      {shareModalOpen && selectedFileForShare && (
        <FileShareModal
          fileId={selectedFileForShare.id}
          fileName={selectedFileForShare.name}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedFileForShare(null);
          }}
        />
      )}

      {/* Document Viewer */}
      {selectedFileId && (
        <DocumentViewer
          fileId={selectedFileId}
          onClose={() => setSelectedFileId(null)}
        />
      )}

      {/* Folders */}
      {dataRoom.folders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Folders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataRoom.folders.map((folder: any) => (
              <div
                key={folder.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <FolderOpen className="h-8 w-8 text-blue-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{folder.name}</p>
                  <p className="text-sm text-gray-500">{folder._count.files} files</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root level files */}
      {dataRoom.files.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Files</h3>
          <div className="space-y-2">
            {dataRoom.files.map((file: any) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • Uploaded {formatDate(file.uploadedAt)} by {file.uploader.firstName} {file.uploader.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedFileId(file.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFileForShare({ id: file.id, name: file.name });
                      setShareModalOpen(true);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {dataRoom.userPermissions.canDownload && (
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dataRoom.folders.length === 0 && dataRoom.files.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
          <p className="text-gray-600 mb-6">Upload your first document to get started.</p>
          {dataRoom.userPermissions.canUpload && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowFileUpload(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function UsersTab({ dataRoom }: { dataRoom: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Users ({dataRoom.userAccess.length})</h3>
        {dataRoom.userPermissions.canInvite && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {dataRoom.userAccess.map((access: any) => (
          <div
            key={access.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-medium text-gray-700">
                  {access.user.firstName[0]}{access.user.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {access.user.firstName} {access.user.lastName}
                </p>
                <p className="text-sm text-gray-500">{access.user.email}</p>
                {access.user.company && (
                  <p className="text-sm text-gray-500">{access.user.company}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {access.role}
              </span>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QATab({ dataRoom }: { dataRoom: any }) {
  return (
    <QASystem
      dataRoomId={dataRoom.id}
      userPermissions={{
        canManageQA: dataRoom.userPermissions.canManageQA,
        canView: dataRoom.userPermissions.canView,
      }}
    />
  );
}

function AnalyticsTab({ dataRoom }: { dataRoom: any }) {
  return <AnalyticsDashboard dataRoomId={dataRoom.id} />;
}
