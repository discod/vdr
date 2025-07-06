import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, File, CheckCircle, AlertCircle, Share2 } from "lucide-react";
import { Button } from "./Button";
import { FileShareModal } from "./FileShareModal";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  storageKey?: string;
  fileId?: number;
}

interface FileUploadProps {
  dataRoomId: number;
  folderId?: number | null;
  onUploadComplete?: (files: any[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function FileUpload({
  dataRoomId,
  folderId,
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
  ],
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<{ id: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  const token = useToken();

  const generatePresignedUrl = useMutation(trpc.generatePresignedUrl.mutationOptions());
  const confirmFileUpload = useMutation(trpc.confirmFileUpload.mutationOptions());

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles = Array.from(selectedFiles).slice(0, maxFiles - files.length);
    const filesWithProgress: FileWithProgress[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    
    setFiles(prev => [...prev, ...filesWithProgress]);
  };

  const handleUploadClick = () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length > 0) {
      uploadFiles(pendingFiles);
    }
  };

  const uploadFiles = async (filesToUpload: FileWithProgress[]) => {
    if (!token) return;

    for (const fileItem of filesToUpload) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.file === fileItem.file ? { ...f, status: 'uploading' } : f
        ));

        // Generate presigned URL
        const { presignedUrl, storageKey } = await generatePresignedUrl.mutateAsync({
          token,
          dataRoomId,
          folderId,
          fileName: fileItem.file.name,
          fileSize: fileItem.file.size,
          mimeType: fileItem.file.type,
        });

        // Upload to Minio
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setFiles(prev => prev.map(f => 
              f.file === fileItem.file ? { ...f, progress } : f
            ));
          }
        };

        xhr.onload = async () => {
          if (xhr.status === 200) {
            try {
              // Confirm upload
              const result = await confirmFileUpload.mutateAsync({
                token,
                dataRoomId,
                folderId,
                fileName: fileItem.file.name,
                originalName: fileItem.file.name,
                fileSize: fileItem.file.size,
                mimeType: fileItem.file.type,
                storageKey,
              });

              setFiles(prev => prev.map(f => 
                f.file === fileItem.file ? { 
                  ...f, 
                  status: 'success', 
                  storageKey,
                  fileId: result.fileId 
                } : f
              ));
            } catch (error) {
              setFiles(prev => prev.map(f => 
                f.file === fileItem.file ? { 
                  ...f, 
                  status: 'error', 
                  error: 'Failed to confirm upload' 
                } : f
              ));
            }
          } else {
            setFiles(prev => prev.map(f => 
              f.file === fileItem.file ? { 
                ...f, 
                status: 'error', 
                error: 'Upload failed' 
              } : f
            ));
          }
        };

        xhr.onerror = () => {
          setFiles(prev => prev.map(f => 
            f.file === fileItem.file ? { 
              ...f, 
              status: 'error', 
              error: 'Upload failed' 
            } : f
          ));
        };

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', fileItem.file.type);
        xhr.send(fileItem.file);

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.file === fileItem.file ? { 
            ...f, 
            status: 'error', 
            error: 'Failed to generate upload URL' 
          } : f
        ));
      }
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            handleFileSelect(e.dataTransfer.files);
          }
        }}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported formats: {acceptedTypes.join(', ')}
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{fileItem.file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(fileItem.file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {fileItem.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileItem.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {Math.round(fileItem.progress)}%
                    </span>
                  </div>
                )}

                {fileItem.status === 'success' && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFileForShare({ 
                          id: fileItem.fileId || 0, 
                          name: fileItem.file.name 
                        });
                        setShareModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                )}

                {fileItem.status === 'error' && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-500">{fileItem.error}</span>
                  </div>
                )}

                {(fileItem.status === 'pending' || fileItem.status === 'error') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileItem.file)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.some(f => f.status === 'pending') && (
        <div className="flex justify-end">
          <Button
            onClick={handleUploadClick}
            disabled={files.every(f => f.status !== 'pending')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload {files.filter(f => f.status === 'pending').length} file{files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}
          </Button>
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
    </div>
  );
}
