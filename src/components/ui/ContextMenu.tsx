import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  Eye, 
  Download, 
  Share2, 
  Star, 
  MessageSquare, 
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Move
} from "lucide-react";

interface ContextMenuItem {
  id: string;
  label: string;
  icon: any;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  dividerAfter?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: ContextMenuItem[];
}

export function ContextMenu({ isOpen, position, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Adjust position to keep menu within viewport
  const adjustedPosition = { ...position };
  const menuWidth = 200;
  const menuHeight = items.length * 40 + 16; // Approximate height

  if (position.x + menuWidth > window.innerWidth) {
    adjustedPosition.x = window.innerWidth - menuWidth - 8;
  }
  if (position.y + menuHeight > window.innerHeight) {
    adjustedPosition.y = window.innerHeight - menuHeight - 8;
  }

  const menuElement = (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.id}>
            <button
              onClick={() => {
                item.onClick();
                onClose();
              }}
              disabled={item.disabled}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-left transition-colors ${
                item.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : item.destructive
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
            {item.dividerAfter && index < items.length - 1 && (
              <div className="border-t border-gray-100 my-1" />
            )}
          </div>
        );
      })}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(menuElement, document.body) : null;
}

// Hook for managing context menu state
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    items: ContextMenuItem[];
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
  });

  const openContextMenu = (event: React.MouseEvent, items: ContextMenuItem[]) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      items,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };
}

// Predefined file action sets
export const createFileContextMenuItems = (
  file: any,
  permissions: any,
  actions: {
    onView?: () => void;
    onDownload?: () => void;
    onShare?: () => void;
    onFavorite?: () => void;
    onAskQuestion?: () => void;
    onEdit?: () => void;
    onMove?: () => void;
    onDelete?: () => void;
  }
): ContextMenuItem[] => {
  const items: ContextMenuItem[] = [];

  // View action
  if (actions.onView) {
    items.push({
      id: 'view',
      label: 'View File',
      icon: Eye,
      onClick: actions.onView,
    });
  }

  // Download action
  if (actions.onDownload && permissions.canDownload) {
    items.push({
      id: 'download',
      label: 'Download',
      icon: Download,
      onClick: actions.onDownload,
    });
  }

  // Share action
  if (actions.onShare) {
    items.push({
      id: 'share',
      label: 'Share Link',
      icon: Share2,
      onClick: actions.onShare,
      dividerAfter: true,
    });
  }

  // Favorite action
  if (actions.onFavorite) {
    items.push({
      id: 'favorite',
      label: file.isFavorited ? 'Remove from Favorites' : 'Add to Favorites',
      icon: Star,
      onClick: actions.onFavorite,
    });
  }

  // Ask question action
  if (actions.onAskQuestion) {
    items.push({
      id: 'ask-question',
      label: 'Ask Question',
      icon: MessageSquare,
      onClick: actions.onAskQuestion,
      dividerAfter: true,
    });
  }

  // Edit actions (for contributors/admins)
  if (permissions.canEdit) {
    if (actions.onEdit) {
      items.push({
        id: 'edit',
        label: 'Edit Details',
        icon: Edit,
        onClick: actions.onEdit,
      });
    }

    if (actions.onMove) {
      items.push({
        id: 'move',
        label: 'Move to Folder',
        icon: Move,
        onClick: actions.onMove,
      });
    }

    if (actions.onDelete) {
      items.push({
        id: 'delete',
        label: 'Delete File',
        icon: Trash2,
        onClick: actions.onDelete,
        destructive: true,
        dividerAfter: true,
      });
    }
  }

  return items;
};
