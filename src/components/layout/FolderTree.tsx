import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FolderOpen, 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  Home,
  FileText
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";

interface FolderNode {
  id: number | null;
  name: string;
  path: string;
  children?: FolderNode[];
  isExpanded?: boolean;
  fileCount?: number;
  isLoaded?: boolean;
}

interface FolderTreeProps {
  dataRoomId: number;
  currentFolderId: number | null;
  onFolderSelect: (folderId: number | null, path: Array<{ id: number | null; name: string }>) => void;
  className?: string;
}

export function FolderTree({ 
  dataRoomId, 
  currentFolderId, 
  onFolderSelect, 
  className = "" 
}: FolderTreeProps) {
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number | null>>(new Set([null]));
  
  const token = useToken();
  const trpc = useTRPC();

  // Fetch root folders initially
  const rootFoldersQuery = useQuery({
    ...trpc.getFolderContents.queryOptions({
      authToken: token!,
      folderId: null,
      dataRoomId,
    }),
    enabled: !!token,
  });

  // Initialize folder tree with root folders
  useEffect(() => {
    if (rootFoldersQuery.data?.subfolders) {
      const rootNodes: FolderNode[] = rootFoldersQuery.data.subfolders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        path: folder.name,
        fileCount: folder._count?.files || 0,
        isLoaded: false,
        children: [],
      }));
      setFolderTree(rootNodes);
    }
  }, [rootFoldersQuery.data]);

  const toggleFolder = async (folderId: number | null) => {
    const newExpanded = new Set(expandedFolders);
    
    if (expandedFolders.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
      
      // Load folder contents if not already loaded
      if (folderId !== null) {
        await loadFolderContents(folderId);
      }
    }
    
    setExpandedFolders(newExpanded);
  };

  const loadFolderContents = async (folderId: number) => {
    try {
      const response = await trpc.getFolderContents.query({
        authToken: token!,
        folderId,
        dataRoomId,
      });

      if (response.subfolders) {
        setFolderTree(prevTree => updateFolderInTree(prevTree, folderId, response.subfolders));
      }
    } catch (error) {
      console.error('Failed to load folder contents:', error);
    }
  };

  const updateFolderInTree = (tree: FolderNode[], targetId: number, newChildren: any[]): FolderNode[] => {
    return tree.map(node => {
      if (node.id === targetId) {
        return {
          ...node,
          isLoaded: true,
          children: newChildren.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
            path: `${node.path}/${folder.name}`,
            fileCount: folder._count?.files || 0,
            isLoaded: false,
            children: [],
          })),
        };
      } else if (node.children) {
        return {
          ...node,
          children: updateFolderInTree(node.children, targetId, newChildren),
        };
      }
      return node;
    });
  };

  const buildPathFromNode = (targetId: number | null, tree: FolderNode[], currentPath: Array<{ id: number | null; name: string }> = []): Array<{ id: number | null; name: string }> | null => {
    for (const node of tree) {
      const newPath = [...currentPath, { id: node.id, name: node.name }];
      
      if (node.id === targetId) {
        return newPath;
      }
      
      if (node.children) {
        const result = buildPathFromNode(targetId, node.children, newPath);
        if (result) return result;
      }
    }
    return null;
  };

  const handleFolderClick = (folderId: number | null, folderName: string) => {
    let path: Array<{ id: number | null; name: string }>;
    
    if (folderId === null) {
      path = [{ id: null, name: "Root" }];
    } else {
      const foundPath = buildPathFromNode(folderId, folderTree);
      path = foundPath ? [{ id: null, name: "Root" }, ...foundPath] : [{ id: null, name: "Root" }];
    }
    
    onFolderSelect(folderId, path);
  };

  const renderFolderNode = (node: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = currentFolderId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id || 'root'}>
        <div
          className={`flex items-center py-2 px-2 rounded-md cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => handleFolderClick(node.id, node.name)}
        >
          <div className="flex items-center space-x-2 flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-5 h-4" />
            )}
            
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500" />
            )}
            
            <span className="text-sm font-medium truncate">{node.name}</span>
          </div>
          
          {node.fileCount !== undefined && node.fileCount > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              {node.fileCount}
            </span>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Folders</h3>
      </div>
      
      <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
        {/* Root folder */}
        <div
          className={`flex items-center py-2 px-2 rounded-md cursor-pointer transition-colors ${
            currentFolderId === null 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => handleFolderClick(null, "Root")}
        >
          <Home className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Root</span>
        </div>
        
        {/* Folder tree */}
        {folderTree.map(node => renderFolderNode(node))}
        
        {rootFoldersQuery.isLoading && (
          <div className="animate-pulse space-y-2 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        )}
        
        {folderTree.length === 0 && !rootFoldersQuery.isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No folders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
