import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { 
  X, 
  Share2, 
  Link, 
  Mail, 
  Calendar, 
  Eye, 
  Download, 
  Printer, 
  Lock,
  Copy,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";

const shareLinkSchema = z.object({
  expiresAt: z.string().optional(),
  maxViews: z.number().min(1, "Must allow at least 1 view").optional(),
  password: z.string().optional(),
  allowDownload: z.boolean(),
  allowPrint: z.boolean(),
  requireAuth: z.boolean(),
});

const inviteSchema = z.object({
  recipientEmail: z.string().email("Invalid email address"),
  recipientName: z.string().min(1, "Name is required"),
  message: z.string().optional(),
  expiresAt: z.string().optional(),
  maxViews: z.number().min(1, "Must allow at least 1 view").optional(),
  allowDownload: z.boolean(),
  allowPrint: z.boolean(),
});

function ShareLinkTab({ fileId, onGenerate, onRefetch }: { 
  fileId: number; 
  onGenerate: any; 
  onRefetch: () => void;
}) {
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(shareLinkSchema),
    defaultValues: {
      allowDownload: true,
      allowPrint: true,
      requireAuth: false,
    },
  });

  const watchRequireAuth = watch("requireAuth");

  const onSubmit = async (data: any) => {
    try {
      const formattedData = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      };

      const result = await onGenerate.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        fileId,
        ...formattedData,
      });

      setGeneratedLink(result.shareUrl);
      onRefetch();
      toast.success("Share link generated successfully");
    } catch (error) {
      toast.error("Failed to generate share link");
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-2">Generate Share Link</h4>
        <p className="text-sm text-gray-600">
          Create a secure link that can be shared with anyone. You can set expiration and access limits.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Date
            </label>
            <input
              {...register("expiresAt")}
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Leave empty for no expiration</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Views
            </label>
            <input
              {...register("maxViews", { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Unlimited"
            />
            {errors.maxViews && (
              <p className="mt-1 text-sm text-red-600">{errors.maxViews.message}</p>
            )}
          </div>

          {!watchRequireAuth && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Protection
              </label>
              <input
                {...register("password")}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional password"
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-900">Permissions</h5>
          
          <div className="flex items-center">
            <input
              {...register("allowDownload")}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Allow downloads
            </label>
          </div>

          <div className="flex items-center">
            <input
              {...register("allowPrint")}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Allow printing
            </label>
          </div>

          <div className="flex items-center">
            <input
              {...register("requireAuth")}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Require user authentication
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={onGenerate.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {onGenerate.isPending ? "Generating..." : "Generate Link"}
          </Button>
        </div>
      </form>

      {generatedLink && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="text-sm font-medium text-green-900 mb-2">Share Link Generated</h5>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={generatedLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-md bg-white"
            />
            <Button size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.open(generatedLink, '_blank')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InviteTab({ fileId, onSend, onRefetch }: { 
  fileId: number; 
  onSend: any; 
  onRefetch: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      allowDownload: true,
      allowPrint: true,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const formattedData = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      };

      await onSend.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        fileId,
        ...formattedData,
      });

      onRefetch();
      reset();
      toast.success("Invitation sent successfully");
    } catch (error) {
      toast.error("Failed to send invitation");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-2">Send Invitation</h4>
        <p className="text-sm text-gray-600">
          Send a direct invitation to someone's email address with custom access settings.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <input
              {...register("recipientEmail")}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
            {errors.recipientEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.recipientEmail.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Name
            </label>
            <input
              {...register("recipientName")}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
            {errors.recipientName && (
              <p className="mt-1 text-sm text-red-600">{errors.recipientName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Date
            </label>
            <input
              {...register("expiresAt")}
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Views
            </label>
            <input
              {...register("maxViews", { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Unlimited"
            />
            {errors.maxViews && (
              <p className="mt-1 text-sm text-red-600">{errors.maxViews.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Message
          </label>
          <textarea
            {...register("message")}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional message to include in the invitation email"
          />
        </div>

        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-900">Permissions</h5>
          
          <div className="flex items-center">
            <input
              {...register("allowDownload")}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Allow downloads
            </label>
          </div>

          <div className="flex items-center">
            <input
              {...register("allowPrint")}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Allow printing
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={onSend.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Mail className="h-4 w-4 mr-2" />
            {onSend.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ManageSharesTab({ shares, onRevoke, onRefetch }: { 
  shares: any[]; 
  onRevoke: any;
  onRefetch: () => void;
}) {
  const handleRevoke = async (shareId: number) => {
    if (confirm("Are you sure you want to revoke this share? The link will no longer work.")) {
      try {
        await onRevoke.mutateAsync({
          token: localStorage.getItem("auth-token") || "",
          shareId,
        });
        onRefetch();
        toast.success("Share revoked successfully");
      } catch (error) {
        toast.error("Failed to revoke share");
      }
    }
  };

  const copyLink = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  if (shares.length === 0) {
    return (
      <div className="text-center py-8">
        <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Shares</h4>
        <p className="text-gray-600">
          You haven't created any shares for this file yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-2">Active Shares</h4>
        <p className="text-sm text-gray-600">
          Manage existing shares and view access statistics.
        </p>
      </div>

      <div className="space-y-3">
        {shares.map((share: any) => (
          <div key={share.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {share.recipientEmail ? (
                    <>
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {share.recipientName} ({share.recipientEmail})
                      </span>
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">Share Link</span>
                    </>
                  )}
                  
                  {share.password && <Lock className="h-4 w-4 text-gray-400" />}
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {share.currentViews}/{share.maxViews || "∞"} views
                  </span>
                  
                  {share.expiresAt && (
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Expires {new Date(share.expiresAt).toLocaleDateString()}
                    </span>
                  )}

                  <div className="flex items-center space-x-1">
                    {share.allowDownload && <Download className="h-3 w-3" />}
                    {share.allowPrint && <Printer className="h-3 w-3" />}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!share.recipientEmail && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyLink(share.shareUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevoke(share.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FileShareModalProps {
  fileId: number;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FileShareModal({ fileId, fileName, isOpen, onClose }: FileShareModalProps) {
  const [activeTab, setActiveTab] = useState<"link" | "invite" | "manage">("link");
  const trpc = useTRPC();

  const { data: existingShares, refetch: refetchShares } = useQuery(
    trpc.getFileShares.queryOptions({
      token: localStorage.getItem("auth-token") || "",
      fileId,
    })
  );

  const generateShareLink = useMutation(
    trpc.generateFileShareLink.mutationOptions()
  );

  const sendFileInvitation = useMutation(
    trpc.sendFileInvitation.mutationOptions()
  );

  const revokeShareLink = useMutation(
    trpc.revokeFileShareLink.mutationOptions()
  );

  if (!isOpen) return null;

  const tabs = [
    { id: "link", label: "Share Link", icon: Link },
    { id: "invite", label: "Send Invitation", icon: Mail },
    { id: "manage", label: "Manage Shares", icon: Eye },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Share File</h3>
            <p className="text-sm text-gray-600">{fileName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "link" && (
          <ShareLinkTab 
            fileId={fileId} 
            onGenerate={generateShareLink} 
            onRefetch={refetchShares}
          />
        )}
        {activeTab === "invite" && (
          <InviteTab 
            fileId={fileId} 
            onSend={sendFileInvitation} 
            onRefetch={refetchShares}
          />
        )}
        {activeTab === "manage" && (
          <ManageSharesTab 
            shares={existingShares || []} 
            onRevoke={revokeShareLink}
            onRefetch={refetchShares}
          />
        )}
      </div>
    </div>
  );
}
