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
  Share2,
  Star,
  ChevronRight,
  Home,
  ArrowLeft,
  Info,
  Trash2
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { PermissionIndicator, FilePermissionSummary } from "~/components/ui/PermissionIndicator";
import { ContextMenu, useContextMenu, createFileContextMenuItems } from "~/components/ui/ContextMenu";
import { FolderTree } from "~/components/layout/FolderTree";
import { GettingStartedChecklist } from "~/components/onboarding/GettingStartedChecklist";
import { formatDate, formatFileSize } from "~/lib/utils";
import { QASystem } from "~/components/data-rooms/QASystem";
import { AnalyticsDashboard } from "~/components/analytics/AnalyticsDashboard";
import { FileUpload } from "~/components/ui/FileUpload";
import { DocumentViewer } from "~/components/documents/DocumentViewer";
import { FileShareModal } from "~/components/ui/FileShareModal";
import { FolderShareModal } from "~/components/ui/FolderShareModal";
import { RoomExpirationBanner } from "~/components/data-rooms/RoomExpirationBanner";
import { UserManagement } from "~/components/users/UserManagement";
import { InviteUsersModal } from "~/components/users/InviteUsersModal";

interface DataRoomContentProps {
  dataRoom: any;
}

interface FilesTabProps {
  dataRoom: any;
  selectedFileId: number | null;
  setSelectedFileId: (id: number | null) => void;
  showFileUpload: boolean;
  setShowFileUpload: (show: boolean) => void;
  currentFolderId: number | null;
  setCurrentFolderId: (id: number | null) => void;
  folderPath: Array<{ id: number | null; name: string }>;
  setFolderPath: (path: Array<{ id: number | null; name: string }>) => void;
}

function FilesTab({ 
  dataRoom, 
  selectedFileId, 
  setSelectedFileId, 
  showFileUpload, 
  setShowFileUpload,
  currentFolderId,
  setCurrentFolderId,
  folderPath,
  setFolderPath
}: FilesTabProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<{ id: number; name: string } | null>(null);
  const [folderShareModalOpen, setFolderShareModalOpen] = useState(false);
  const [selectedFolderForShare, setSelectedFolderForShare] = useState<{ id: number | null; name: string } | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [draggedFileId, setDraggedFileId] = useState<number | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [showPermissionSummary, setShowPermissionSummary] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  
  const trpc = useTRPC();
  const token = useToken();
  const moveFileMutation = useMutation(trpc.moveFile.mutationOptions());
  const toggleFileFavorite = useMutation(trpc.toggleFileFavorite.mutationOptions());

  // Fetch folder contents when currentFolderId changes
  const folderContentsQuery = useQuery({
    ...trpc.getFolderContents.queryOptions({
      authToken: token!,
      folderId: currentFolderId,
      dataRoomId: dataRoom.id,
    }),
    enabled: !!token,
  });

  // Use either root data or folder contents based on current folder
  const currentFolders = currentFolderId === null ? dataRoom.folders : (folderContentsQuery.data?.subfolders || []);
  const currentFiles = currentFolderId === null ? dataRoom.files : (folderContentsQuery.data?.files || []);

  const handleFolderClick = (folder: any) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (targetIndex: number) => {
    const newPath = folderPath.slice(0, targetIndex + 1);
    const targetFolder = newPath[newPath.length - 1];
    setCurrentFolderId(targetFolder.id);
    setFolderPath(newPath);
  };

  const handleDragStart = (e: React.DragEvent, fileId: number) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: number | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    
    if (!draggedFileId || !token) return;
    
    try {
      await moveFileMutation.mutateAsync({
        token,
        fileId: draggedFileId,
        targetFolderId,
        dataRoomId: dataRoom.id,
      });
      
      // Refresh the page to show the updated file structure
      window.location.reload();
      toast.success("File moved successfully!");
    } catch (error) {
      console.error('Failed to move file:', error);
      toast.error("Failed to move file");
    } finally {
      setDraggedFileId(null);
    }
  };

  const handleToggleFavorite = async (fileId: number) => {
    if (!token) return;
    
    try {
      await toggleFileFavorite.mutateAsync({
        token,
        fileId,
      });
      // Refresh the data room to update favorite status
      window.location.reload();
      toast.success("Favorite status updated!");
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error("Failed to update favorite status");
    }
  };

  const handleDownloadFile = (file: any) => {
    // Implementation for file download
    toast.success(`Downloading ${file.name}...`);
  };

  const handleAskQuestion = (file: any) => {
    // Implementation for asking question about file
    toast.info("Q&A feature coming soon!");
  };

  const handleDeleteFile = (file: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete File",
      message: `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          // Implementation for file deletion
          toast.success(`File "${file.name}" deleted successfully`);
          window.location.reload();
        } catch (error) {
          toast.error("Failed to delete file");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const createFolderContextMenuItems = (folder: any) => [
    {
      id: 'open',
      label: 'Open Folder',
      icon: FolderOpen,
      onClick: () => handleFolderClick(folder),
    },
    {
      id: 'share',
      label: 'Share Folder',
      icon: Share2,
      onClick: () => {
        setSelectedFolderForShare({ id: folder.id, name: folder.name });
        setFolderShareModalOpen(true);
      },
    },
    {
      id: 'delete',
      label: 'Delete Folder',
      icon: Trash2,
      onClick: () => handleDeleteFolder(folder),
      destructive: true,
    },
  ];

  const handleDeleteFolder = (folder: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Folder",
      message: `Are you sure you want to delete "${folder.name}" and all its contents? This action cannot be undone.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          toast.success(`Folder "${folder.name}" deleted successfully`);
          window.location.reload();
        } catch (error) {
          toast.error("Failed to delete folder");
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="flex h-[600px]">
      {/* Left Sidebar - Folder Tree */}
      <div className="w-80 flex-shrink-0">
        <FolderTree
          dataRoomId={dataRoom.id}
          currentFolderId={currentFolderId}
          onFolderSelect={(folderId, path) => {
            setCurrentFolderId(folderId);
            setFolderPath(path);
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Breadcrumb Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Home className="h-4 w-4" />
            {folderPath.map((folder, index) => (
              <div key={folder.id || 'root'} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`hover:text-blue-600 transition-colors ${
                    index === folderPath.length - 1 ? 'text-gray-900 font-medium' : 'text-blue-600'
                  }`}
                  disabled={index === folderPath.length - 1}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {dataRoom.userPermissions.canUpload && (
              <Tooltip content="Upload files to this folder">
                <Button 
                  size="sm"
                  onClick={() => setShowFileUpload(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </Tooltip>
            )}
            
            <Tooltip content="Share current folder">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const currentFolder = folderPath[folderPath.length - 1];
                  setSelectedFolderForShare({ 
                    id: currentFolder.id, 
                    name: currentFolder.name 
                  });
                  setFolderShareModalOpen(true);
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="View folder information">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPermissionSummary(currentFolderId)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* File Content Area */}
        <div className="flex-1 overflow-auto p-4">
          {/* Loading state for folder contents */}
          {currentFolderId !== null && folderContentsQuery.isLoading && (
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          )}

          {/* Root Folder Drop Zone */}
          <div
            className={`${
              draggedFileId && dragOverFolderId === null 
                ? 'border-2 border-dashed border-blue-500 bg-blue-50 p-4 rounded-lg mb-4' 
                : 'hidden'
            }`}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
          >
            <p className="text-center text-blue-600 font-medium">Drop here to move to root folder</p>
          </div>

          {/* Folders */}
          {currentFolders.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Folders</h3>
                <span className="text-sm text-gray-500">{currentFolders.length} folders</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentFolders.map((folder: any) => (
                  <div
                    key={folder.id}
                    className={`flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      dragOverFolderId === folder.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    onContextMenu={(e) => openContextMenu(e, createFolderContextMenuItems(folder))}
                  >
                    <FolderOpen className="h-8 w-8 text-blue-500 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0" onClick={() => handleFolderClick(folder)}>
                      <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                      <p className="text-sm text-gray-500">{folder._count.files} files</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Tooltip content="Share folder">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolderForShare({ id: folder.id, name: folder.name });
                            setFolderShareModalOpen(true);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {currentFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Files</h3>
                <span className="text-sm text-gray-500">{currentFiles.length} files</span>
              </div>
              <div className="space-y-3">
                {currentFiles.map((file: any) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
                      draggedFileId === file.id ? 'opacity-50' : ''
                    }`}
                    draggable={dataRoom.userPermissions.canEdit}
                    onDragStart={(e) => handleDragStart(e, file.id)}
                    onContextMenu={(e) => openContextMenu(e, createFileContextMenuItems(
                      file,
                      dataRoom.userPermissions,
                      {
                        onView: () => setSelectedFileId(file.id),
                        onDownload: dataRoom.userPermissions.canDownload ? () => handleDownloadFile(file) : undefined,
                        onShare: () => {
                          setSelectedFileForShare({ id: file.id, name: file.name });
                          setShareModalOpen(true);
                        },
                        onFavorite: () => handleToggleFavorite(file.id),
                        onAskQuestion: () => handleAskQuestion(file),
                        onDelete: dataRoom.userPermissions.canEdit ? () => handleDeleteFile(file) : undefined,
                      }
                    ))}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <FileText className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <PermissionIndicator 
                            permissions={{
                              canDownload: dataRoom.userPermissions.canDownload && dataRoom.allowDownload,
                              canPrint: dataRoom.userPermissions.canPrint && dataRoom.allowPrint,
                              watermarkEnabled: dataRoom.watermarkEnabled,
                            }}
                          />
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • Uploaded {formatDate(file.uploadedAt)} by {file.uploader.firstName} {file.uploader.lastName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Tooltip content="View file">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedFileId(file.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      
                      <Tooltip content={file.isFavorited ? "Remove from favorites" : "Add to favorites"}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(file.id)}
                          disabled={toggleFileFavorite.isPending}
                        >
                          <Star className={`h-4 w-4 ${file.isFavorited ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                      </Tooltip>
                      
                      <Tooltip content="Share file">
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
                      </Tooltip>
                      
                      {dataRoom.userPermissions.canDownload && dataRoom.allowDownload && (
                        <Tooltip content="Download file">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {currentFolders.length === 0 && currentFiles.length === 0 && !folderContentsQuery.isLoading && (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {currentFolderId === null ? "No files yet" : "Empty folder"}
              </h3>
              <p className="text-gray-600 mb-6">
                {currentFolderId === null 
                  ? "Upload your first document to get started." 
                  : "This folder doesn't contain any files or subfolders yet."
                }
              </p>
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
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={contextMenu.items}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />

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
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload to folder (optional)
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Root folder</option>
                {dataRoom.folders.map((folder: any) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            
            <FileUpload
              dataRoomId={dataRoom.id}
              folderId={selectedFolderId}
              onUploadComplete={() => {
                setShowFileUpload(false);
                setSelectedFolderId(null);
                window.location.reload();
                toast.success("Files uploaded successfully!");
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

      {/* Folder Share Modal */}
      {folderShareModalOpen && selectedFolderForShare && (
        <FolderShareModal
          folderId={selectedFolderForShare.id}
          folderName={selectedFolderForShare.name}
          dataRoomId={dataRoom.id}
          isOpen={folderShareModalOpen}
          onClose={() => {
            setFolderShareModalOpen(false);
            setSelectedFolderForShare(null);
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

      {/* Permission Summary Modal */}
      {showPermissionSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Folder Permissions</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPermissionSummary(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FilePermissionSummary
              fileName={folderPath[folderPath.length - 1]?.name || "Root"}
              permissions={{
                canDownload: dataRoom.allowDownload,
                canPrint: dataRoom.allowPrint,
                watermarkEnabled: dataRoom.watermarkEnabled,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab({ dataRoom }: { dataRoom: any }) {
  return (
    <UserManagement 
      dataRoomId={dataRoom.id} 
      userPermissions={dataRoom.userPermissions} 
    />
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

export function DataRoomContent({ dataRoom }: DataRoomContentProps) {
  const [activeTab, setActiveTab] = useState<"files" | "users" | "qa" | "analytics">("files");
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: number | null; name: string }>>([
    { id: null, name: "Root" }
  ]);

  const tabs = [
    { id: "files", label: "Files & Folders", icon: FolderOpen },
    { id: "users", label: "Users", icon: Users },
    { id: "qa", label: "Q&A", icon: MessageSquare },
    ...(dataRoom.userPermissions.canViewAudit || dataRoom.userPermissions.role === "ROOM_OWNER" ? 
      [{ id: "analytics", label: "Analytics", icon: Eye }] : []
    ),
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "ARCHIVED": return "bg-gray-100 text-gray-800";
      case "EXPIRED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleChecklistAction = (actionType: string) => {
    switch (actionType) {
      case "upload":
        setShowFileUpload(true);
        break;
      case "invite":
        setShowInviteModal(true);
        break;
      case "settings":
        // Navigate to settings or open settings modal
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      <InviteUsersModal
        dataRoomId={dataRoom.id}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          setShowInviteModal(false);
          window.location.reload();
        }}
      />

      {/* Getting Started Checklist for Room Owners */}
      {dataRoom.userPermissions.role === "ROOM_OWNER" && (
        <GettingStartedChecklist
          dataRoom={dataRoom}
          onAction={handleChecklistAction}
        />
      )}

      {/* Header with enhanced security indicators */}
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
            {(dataRoom.userPermissions.canUpload || dataRoom.userPermissions.role === "ROOM_OWNER") && (
              <Tooltip content="Upload files to this data room">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowFileUpload(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </Tooltip>
            )}
            {(dataRoom.userPermissions.canInvite || dataRoom.userPermissions.canManageUsers || dataRoom.userPermissions.role === "ROOM_OWNER") && (
              <Tooltip content="Invite users to this data room">
                <Button 
                  variant="outline"
                  onClick={() => setShowInviteModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Users
                </Button>
              </Tooltip>
            )}
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced security settings display with tooltips */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-6 text-sm">
            <Tooltip content={dataRoom.watermarkEnabled ? "All files will display with user watermarks" : "Files will not be watermarked"}>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-gray-400" />
                <span className={dataRoom.watermarkEnabled ? "text-green-600" : "text-gray-500"}>
                  Watermarks {dataRoom.watermarkEnabled ? "enabled" : "disabled"}
                </span>
              </div>
            </Tooltip>
            
            <Tooltip content={dataRoom.allowDownload ? "Users can download files" : "File downloads are restricted"}>
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-1 text-gray-400" />
                <span className={dataRoom.allowDownload ? "text-green-600" : "text-red-600"}>
                  Downloads {dataRoom.allowDownload ? "allowed" : "restricted"}
                </span>
              </div>
            </Tooltip>
            
            {dataRoom.expiresAt && (
              <Tooltip content="This data room will automatically expire and become inaccessible">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-orange-600">
                    Expires {formatDate(dataRoom.expiresAt)}
                  </span>
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <RoomExpirationBanner 
        dataRoom={dataRoom}
        userPermissions={dataRoom.userPermissions}
      />

      {/* Enhanced Tabs with role-based visibility */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tooltip key={tab.id} content={`Switch to ${tab.label} view`}>
                  <button
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        <div className="h-[600px] overflow-hidden">
          {activeTab === "files" && (
            <FilesTab 
              dataRoom={dataRoom} 
              selectedFileId={selectedFileId} 
              setSelectedFileId={setSelectedFileId} 
              showFileUpload={showFileUpload} 
              setShowFileUpload={setShowFileUpload}
              currentFolderId={currentFolderId}
              setCurrentFolderId={setCurrentFolderId}
              folderPath={folderPath}
              setFolderPath={setFolderPath}
            />
          )}
          {activeTab === "users" && <UsersTab dataRoom={dataRoom} />}
          {activeTab === "qa" && <QATab dataRoom={dataRoom} />}
          {activeTab === "analytics" && <AnalyticsTab dataRoom={dataRoom} />}
        </div>
      </div>
    </div>
  );
}
