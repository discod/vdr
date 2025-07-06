import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Save, Shield, Palette, Clock, Users, Eye, Download, Printer } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";

const securitySchema = z.object({
  allowDownload: z.boolean(),
  allowPrint: z.boolean(),
  allowCopyPaste: z.boolean(),
  watermarkEnabled: z.boolean(),
  requireNDA: z.boolean(),
  expiresAt: z.string().optional(),
  ipWhitelist: z.string().optional(),
  allowedCountries: z.string().optional(),
});

const brandingSchema = z.object({
  customLogo: z.string().url().optional().or(z.literal("")),
  customColors: z.string().optional(),
  customSubdomain: z.string().optional(),
});

const accessSchema = z.object({
  defaultRole: z.enum(["VIEWER", "CONTRIBUTOR", "AUDITOR"]),
  autoApproveInvitations: z.boolean(),
  maxUsers: z.number().min(1, "Must allow at least 1 user").optional(),
  sessionTimeout: z.number().min(5, "Minimum 5 minutes").max(480, "Maximum 8 hours"),
});

interface DataRoomSettingsProps {
  dataRoomId: number;
}

export function DataRoomSettings({ dataRoomId }: DataRoomSettingsProps) {
  const [activeTab, setActiveTab] = useState<"security" | "branding" | "access">("security");
  const trpc = useTRPC();

  const { data: dataRoom, isLoading } = useQuery(
    trpc.getDataRoom.queryOptions({
      token: localStorage.getItem("auth-token") || "",
      roomId: dataRoomId,
    })
  );

  const updateDataRoomSettings = useMutation(
    trpc.updateDataRoomSettings.mutationOptions()
  );

  const tabs = [
    { id: "security", label: "Security & Permissions", icon: Shield },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "access", label: "Access Control", icon: Users },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dataRoom?.userPermissions?.canEdit) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to modify data room settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-6 w-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Data Room Settings</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-1">{dataRoom.name}</h3>
        <p className="text-sm text-blue-700">
          Configure security, branding, and access settings for this data room.
        </p>
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === "security" && (
          <SecuritySettings dataRoom={dataRoom} onSave={updateDataRoomSettings} />
        )}
        {activeTab === "branding" && (
          <BrandingSettings dataRoom={dataRoom} onSave={updateDataRoomSettings} />
        )}
        {activeTab === "access" && (
          <AccessSettings dataRoom={dataRoom} onSave={updateDataRoomSettings} />
        )}
      </div>
    </div>
  );
}

function SecuritySettings({ dataRoom, onSave }: { dataRoom: any; onSave: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      allowDownload: dataRoom?.allowDownload ?? true,
      allowPrint: dataRoom?.allowPrint ?? true,
      allowCopyPaste: dataRoom?.allowCopyPaste ?? false,
      watermarkEnabled: dataRoom?.watermarkEnabled ?? true,
      requireNDA: dataRoom?.requireNDA ?? false,
      expiresAt: dataRoom?.expiresAt ? new Date(dataRoom.expiresAt).toISOString().split('T')[0] : "",
      ipWhitelist: dataRoom?.ipWhitelist?.join(", ") || "",
      allowedCountries: dataRoom?.allowedCountries?.join(", ") || "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const formattedData = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        ipWhitelist: data.ipWhitelist ? data.ipWhitelist.split(",").map((ip: string) => ip.trim()).filter(Boolean) : [],
        allowedCountries: data.allowedCountries ? data.allowedCountries.split(",").map((country: string) => country.trim()).filter(Boolean) : [],
      };

      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        dataRoomId: dataRoom.id,
        category: "SECURITY",
        settings: formattedData,
      });
      toast.success("Security settings updated successfully");
    } catch (error) {
      toast.error("Failed to update security settings");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security & Permissions</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure access permissions and security features for this data room.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Document Permissions</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Allow Downloads</p>
                  <p className="text-sm text-gray-500">Users can download documents</p>
                </div>
              </div>
              <input
                {...register("allowDownload")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Printer className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Allow Printing</p>
                  <p className="text-sm text-gray-500">Users can print documents</p>
                </div>
              </div>
              <input
                {...register("allowPrint")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Allow Copy & Paste</p>
                  <p className="text-sm text-gray-500">Users can copy text from documents</p>
                </div>
              </div>
              <input
                {...register("allowCopyPaste")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Enable Watermarks</p>
                  <p className="text-sm text-gray-500">Add user watermarks to documents</p>
                </div>
              </div>
              <input
                {...register("watermarkEnabled")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Require NDA</p>
                  <p className="text-sm text-gray-500">Users must sign NDA before access</p>
                </div>
              </div>
              <input
                {...register("requireNDA")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Access Restrictions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date
              </label>
              <input
                {...register("expiresAt")}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.expiresAt && (
                <p className="mt-1 text-sm text-red-600">{errors.expiresAt.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">Leave empty for no expiration</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Whitelist
              </label>
              <input
                {...register("ipWhitelist")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.1, 10.0.0.0/8"
              />
              <p className="mt-1 text-sm text-gray-500">Comma-separated IP addresses or ranges</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Countries
              </label>
              <input
                {...register("allowedCountries")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="US, CA, GB, DE"
              />
              <p className="mt-1 text-sm text-gray-500">Comma-separated country codes (leave empty for all countries)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={onSave.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {onSave.isPending ? "Saving..." : "Save Security Settings"}
        </Button>
      </div>
    </form>
  );
}

function BrandingSettings({ dataRoom, onSave }: { dataRoom: any; onSave: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      customLogo: dataRoom?.customLogo || "",
      customColors: dataRoom?.customColors || "",
      customSubdomain: dataRoom?.customSubdomain || "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        dataRoomId: dataRoom.id,
        category: "BRANDING",
        settings: data,
      });
      toast.success("Branding settings updated successfully");
    } catch (error) {
      toast.error("Failed to update branding settings");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Branding & Customization</h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize the appearance of this data room for your users.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Logo URL
          </label>
          <input
            {...register("customLogo")}
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/logo.png"
          />
          {errors.customLogo && (
            <p className="mt-1 text-sm text-red-600">{errors.customLogo.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">URL to your company logo (recommended: 200x50px)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Colors (JSON)
          </label>
          <textarea
            {...register("customColors")}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder='{"primary": "#2563eb", "secondary": "#64748b"}'
          />
          {errors.customColors && (
            <p className="mt-1 text-sm text-red-600">{errors.customColors.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">JSON object with custom color scheme</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Subdomain
          </label>
          <div className="flex">
            <input
              {...register("customSubdomain")}
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="mycompany"
            />
            <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
              .vaultspace.com
            </span>
          </div>
          {errors.customSubdomain && (
            <p className="mt-1 text-sm text-red-600">{errors.customSubdomain.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">Custom subdomain for this data room</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={onSave.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {onSave.isPending ? "Saving..." : "Save Branding Settings"}
        </Button>
      </div>
    </form>
  );
}

function AccessSettings({ dataRoom, onSave }: { dataRoom: any; onSave: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accessSchema),
    defaultValues: {
      defaultRole: "VIEWER",
      autoApproveInvitations: false,
      maxUsers: undefined,
      sessionTimeout: 30,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        dataRoomId: dataRoom.id,
        category: "ACCESS",
        settings: data,
      });
      toast.success("Access settings updated successfully");
    } catch (error) {
      toast.error("Failed to update access settings");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Access Control</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure default access settings and user management options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Role for New Users
          </label>
          <select
            {...register("defaultRole")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="VIEWER">Viewer</option>
            <option value="CONTRIBUTOR">Contributor</option>
            <option value="AUDITOR">Auditor</option>
          </select>
          {errors.defaultRole && (
            <p className="mt-1 text-sm text-red-600">{errors.defaultRole.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Users
          </label>
          <input
            {...register("maxUsers", { valueAsNumber: true })}
            type="number"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="No limit"
          />
          {errors.maxUsers && (
            <p className="mt-1 text-sm text-red-600">{errors.maxUsers.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">Leave empty for no limit</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            {...register("sessionTimeout", { valueAsNumber: true })}
            type="number"
            min="5"
            max="480"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.sessionTimeout && (
            <p className="mt-1 text-sm text-red-600">{errors.sessionTimeout.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            {...register("autoApproveInvitations")}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Auto-approve invitations (users gain access immediately)
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={onSave.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {onSave.isPending ? "Saving..." : "Save Access Settings"}
        </Button>
      </div>
    </form>
  );
}
