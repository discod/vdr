import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Save, Mail, Shield, Palette, Settings } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";

const smtpSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().min(1, "Port must be greater than 0"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromEmail: z.string().email("Invalid email address"),
  fromName: z.string().min(1, "From name is required"),
  secure: z.boolean(),
});

const securitySchema = z.object({
  sessionTimeout: z.number().min(5, "Minimum 5 minutes").max(1440, "Maximum 24 hours"),
  maxLoginAttempts: z.number().min(3, "Minimum 3 attempts").max(10, "Maximum 10 attempts"),
  passwordMinLength: z.number().min(6, "Minimum 6 characters").max(20, "Maximum 20 characters"),
  requireTwoFactor: z.boolean(),
  allowRegistration: z.boolean(),
});

const brandingSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  footerText: z.string().optional(),
});

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState<"smtp" | "security" | "branding">("smtp");
  const trpc = useTRPC();

  const { data: systemSettings, isLoading } = useQuery(
    trpc.getSystemSettings.queryOptions({
      token: localStorage.getItem("auth-token") || "",
    })
  );

  const updateSettings = useMutation(
    trpc.updateSystemSettings.mutationOptions()
  );

  const tabs = [
    { id: "smtp", label: "SMTP Configuration", icon: Mail },
    { id: "security", label: "Security Settings", icon: Shield },
    { id: "branding", label: "Branding", icon: Palette },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-6 w-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
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
        {activeTab === "smtp" && (
          <SMTPSettings settings={systemSettings} onSave={updateSettings} />
        )}
        {activeTab === "security" && (
          <SecuritySettings settings={systemSettings} onSave={updateSettings} />
        )}
        {activeTab === "branding" && (
          <BrandingSettings settings={systemSettings} onSave={updateSettings} />
        )}
      </div>
    </div>
  );
}

function SMTPSettings({ settings, onSave }: { settings: any; onSave: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: settings?.smtp?.host || "",
      port: settings?.smtp?.port || 587,
      username: settings?.smtp?.username || "",
      password: settings?.smtp?.password || "",
      fromEmail: settings?.smtp?.fromEmail || "",
      fromName: settings?.smtp?.fromName || "",
      secure: settings?.smtp?.secure || false,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        category: "SMTP",
        settings: data,
      });
      toast.success("SMTP settings saved successfully");
    } catch (error) {
      toast.error("Failed to save SMTP settings");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure your SMTP server settings for sending emails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Host
          </label>
          <input
            {...register("host")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="smtp.gmail.com"
          />
          {errors.host && (
            <p className="mt-1 text-sm text-red-600">{errors.host.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Port
          </label>
          <input
            {...register("port", { valueAsNumber: true })}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="587"
          />
          {errors.port && (
            <p className="mt-1 text-sm text-red-600">{errors.port.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            {...register("username")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            {...register("password")}
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Email
          </label>
          <input
            {...register("fromEmail")}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="noreply@company.com"
          />
          {errors.fromEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.fromEmail.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Name
          </label>
          <input
            {...register("fromName")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VaultSpace"
          />
          {errors.fromName && (
            <p className="mt-1 text-sm text-red-600">{errors.fromName.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center">
        <input
          {...register("secure")}
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Use secure connection (TLS/SSL)
        </label>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={onSave.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {onSave.isPending ? "Saving..." : "Save SMTP Settings"}
        </Button>
      </div>
    </form>
  );
}

function SecuritySettings({ settings, onSave }: { settings: any; onSave: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      sessionTimeout: settings?.security?.sessionTimeout || 30,
      maxLoginAttempts: settings?.security?.maxLoginAttempts || 5,
      passwordMinLength: settings?.security?.passwordMinLength || 8,
      requireTwoFactor: settings?.security?.requireTwoFactor || false,
      allowRegistration: settings?.security?.allowRegistration || true,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        category: "SECURITY",
        settings: data,
      });
      toast.success("Security settings saved successfully");
    } catch (error) {
      toast.error("Failed to save security settings");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure security policies for your application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            {...register("sessionTimeout", { valueAsNumber: true })}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.sessionTimeout && (
            <p className="mt-1 text-sm text-red-600">{errors.sessionTimeout.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Login Attempts
          </label>
          <input
            {...register("maxLoginAttempts", { valueAsNumber: true })}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.maxLoginAttempts && (
            <p className="mt-1 text-sm text-red-600">{errors.maxLoginAttempts.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Password Length
          </label>
          <input
            {...register("passwordMinLength", { valueAsNumber: true })}
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.passwordMinLength && (
            <p className="mt-1 text-sm text-red-600">{errors.passwordMinLength.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            {...register("requireTwoFactor")}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Require two-factor authentication for all users
          </label>
        </div>

        <div className="flex items-center">
          <input
            {...register("allowRegistration")}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Allow new user registration
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
          {onSave.isPending ? "Saving..." : "Save Security Settings"}
        </Button>
      </div>
    </form>
  );
}

function BrandingSettings({ settings, onSave }: { settings: any; onSave: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      companyName: settings?.branding?.companyName || "",
      logoUrl: settings?.branding?.logoUrl || "",
      primaryColor: settings?.branding?.primaryColor || "#2563eb",
      secondaryColor: settings?.branding?.secondaryColor || "#64748b",
      footerText: settings?.branding?.footerText || "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        category: "BRANDING",
        settings: data,
      });
      toast.success("Branding settings saved successfully");
    } catch (error) {
      toast.error("Failed to save branding settings");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Branding Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize the appearance and branding of your application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            {...register("companyName")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your Company Name"
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL
          </label>
          <input
            {...register("logoUrl")}
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/logo.png"
          />
          {errors.logoUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.logoUrl.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <input
            {...register("primaryColor")}
            type="color"
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.primaryColor && (
            <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Color
          </label>
          <input
            {...register("secondaryColor")}
            type="color"
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.secondaryColor && (
            <p className="mt-1 text-sm text-red-600">{errors.secondaryColor.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Footer Text
        </label>
        <textarea
          {...register("footerText")}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="© 2024 Your Company. All rights reserved."
        />
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
