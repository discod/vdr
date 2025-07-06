import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '~/components/layout/DashboardLayout';
import { DocumentViewer } from '~/components/documents/DocumentViewer';
import { Button } from '~/components/ui/Button';
import { useTRPC } from '~/trpc/react';
import { formatDate, formatFileSize } from '~/lib/utils';
import { 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Download,
  FolderOpen,
  Tag,
  Calendar,
  X
} from 'lucide-react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    mimeTypes: [] as string[],
    tags: [] as string[],
    dataRoomId: undefined as number | undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const trpc = useTRPC();
  const searchFiles = useQuery(trpc.searchFiles.queryOptions({
    token: localStorage.getItem('auth-token') || '',
    query,
    page: currentPage,
    limit: 20,
    mimeTypes: filters.mimeTypes.length > 0 ? filters.mimeTypes : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    dataRoomId: filters.dataRoomId,
  }, {
    enabled: query.length > 0,
  }));

  useEffect(() => {
    if (searchFiles.data) {
      setResults(searchFiles.data.files);
      setTotalPages(searchFiles.data.totalPages);
    }
  }, [searchFiles.data]);

  const handleSearch = () => {
    setCurrentPage(1);
    searchFiles.refetch();
  };

  const getMimeTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return '📊';
    } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return '📈';
    }
    return '📎';
  };

  const commonMimeTypes = [
    { value: 'application/pdf', label: 'PDF' },
    { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word' },
    { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
    { value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint' },
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/png', label: 'PNG' },
    { value: 'text/plain', label: 'Text' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Document Viewer */}
        {selectedFileId && (
          <DocumentViewer
            fileId={selectedFileId}
            onClose={() => setSelectedFileId(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Search</h1>
            <p className="text-gray-600">
              Search across all your accessible documents and data rooms.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents, content, tags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || searchFiles.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {searchFiles.isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* File Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Types
                  </label>
                  <div className="space-y-2">
                    {commonMimeTypes.map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.mimeTypes.includes(type.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                mimeTypes: [...prev.mimeTypes, type.value]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                mimeTypes: prev.mimeTypes.filter(t => t !== type.value)
                              }));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tags separated by commas"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setFilters(prev => ({ ...prev, tags }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => setFilters({ mimeTypes: [], tags: [], dataRoomId: undefined })}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {query && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Search Results
                {searchFiles.data && (
                  <span className="text-gray-500 ml-2">
                    ({searchFiles.data.totalCount} files found)
                  </span>
                )}
              </h3>
            </div>

            {searchFiles.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {results.map((file) => (
                  <div key={file.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="text-2xl">
                          {getMimeTypeIcon(file.mimeType)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {file.name}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <div className="flex items-center">
                              <FolderOpen className="h-3 w-3 mr-1" />
                              {file.dataRoom.name}
                              {file.folder && ` / ${file.folder.name}`}
                            </div>
                            <span>•</span>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(file.uploadedAt)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Uploaded by {file.uploader.firstName} {file.uploader.lastName}
                          </p>
                          {file.tags.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <div className="flex flex-wrap gap-1">
                                {file.tags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFileId(file.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
        )}
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute('/search/')({
  component: SearchPage,
});
