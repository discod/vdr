import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  X, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  MessageSquare,
  Plus,
  Save,
  Lock,
  Unlock
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { formatDate } from "~/lib/utils";

interface DocumentViewerProps {
  fileId: number;
  onClose: () => void;
}

export function DocumentViewer({ fileId, onClose }: DocumentViewerProps) {
  const [document, setDocument] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [newNote, setNewNote] = useState({
    content: '',
    isPrivate: false,
    pageNumber: 1,
    coordinates: null as any,
  });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  const trpc = useTRPC();
  const getDocumentContent = useQuery(trpc.getDocumentContent.queryOptions({
    token: localStorage.getItem('auth-token') || '',
    fileId,
  }));
  const getDocumentNotes = useQuery(trpc.getDocumentNotes.queryOptions({
    token: localStorage.getItem('auth-token') || '',
    fileId,
  }));
  const createDocumentNote = useMutation(trpc.createDocumentNote.mutationOptions());

  useEffect(() => {
    if (getDocumentContent.data) {
      setDocument(getDocumentContent.data);
    }
  }, [getDocumentContent.data]);

  useEffect(() => {
    if (getDocumentNotes.data) {
      setNotes(getDocumentNotes.data);
    }
  }, [getDocumentNotes.data]);

  const handleSaveNote = async () => {
    const token = localStorage.getItem('auth-token');
    if (!token || !newNote.content.trim()) return;

    try {
      await createDocumentNote.mutateAsync({
        token,
        fileId,
        content: newNote.content,
        isPrivate: newNote.isPrivate,
        pageNumber: newNote.pageNumber,
        coordinates: newNote.coordinates,
      });

      setNewNote({
        content: '',
        isPrivate: false,
        pageNumber: 1,
        coordinates: null,
      });
      setIsAddingNote(false);
      getDocumentNotes.refetch();
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleDownload = () => {
    if (document?.presignedUrl) {
      const link = document.createElement('a');
      link.href = document.presignedUrl;
      link.download = document.file.name;
      link.click();
    }
  };

  const handlePrint = () => {
    if (document?.presignedUrl) {
      const printWindow = window.open(document.presignedUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const renderDocumentContent = () => {
    if (!document) return null;

    const { file, presignedUrl } = document;
    const { mimeType } = file;

    // Add watermark overlay if enabled
    const watermarkOverlay = document.file.watermarkEnabled && (
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 opacity-20">
          <div className="transform rotate-45 text-gray-500 text-4xl font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            CONFIDENTIAL
          </div>
        </div>
      </div>
    );

    if (mimeType === 'application/pdf') {
      return (
        <div className="relative">
          <iframe
            src={presignedUrl}
            className="w-full h-full border-0"
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top left'
            }}
          />
          {watermarkOverlay}
        </div>
      );
    }

    if (mimeType.startsWith('image/')) {
      return (
        <div className="relative flex items-center justify-center">
          <img
            src={presignedUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          />
          {watermarkOverlay}
        </div>
      );
    }

    if (mimeType === 'text/plain') {
      return (
        <div className="relative">
          <iframe
            src={presignedUrl}
            className="w-full h-full border-0 bg-white"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left'
            }}
          />
          {watermarkOverlay}
        </div>
      );
    }

    // For Office documents, try to use Office Online viewer
    if (mimeType.includes('officedocument') || mimeType.includes('ms-')) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presignedUrl)}`;
      return (
        <div className="relative">
          <iframe
            src={officeViewerUrl}
            className="w-full h-full border-0"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left'
            }}
          />
          {watermarkOverlay}
        </div>
      );
    }

    // Fallback for unsupported formats
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-lg mb-4">Preview not available for this file type</p>
        <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  if (getDocumentContent.isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full max-w-7xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              {document?.file.name}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRotation((rotation + 90) % 360)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes ({notes.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingNote(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
            {document?.canDownload && (
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            {document?.canPrint && (
              <Button variant="ghost" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Document Viewer */}
          <div className="flex-1 relative overflow-auto" ref={viewerRef}>
            {renderDocumentContent()}
          </div>

          {/* Annotations Sidebar */}
          {showAnnotations && (
            <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Notes & Annotations</h4>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {note.author.firstName} {note.author.lastName}
                        </span>
                        {note.isPrivate && (
                          <Lock className="h-3 w-3 text-gray-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                    {note.pageNumber && (
                      <p className="text-xs text-gray-500 mt-1">
                        Page {note.pageNumber}
                      </p>
                    )}
                  </div>
                ))}

                {notes.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notes yet</p>
                  </div>
                )}
              </div>

              {/* Add Note Form */}
              {isAddingNote && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="space-y-3">
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a note..."
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="note-private"
                        checked={newNote.isPrivate}
                        onChange={(e) => setNewNote(prev => ({ ...prev, isPrivate: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="note-private" className="text-sm text-gray-700">
                        Private note
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleSaveNote}
                        disabled={!newNote.content.trim() || createDocumentNote.isPending}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingNote(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
