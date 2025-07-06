import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Save, User, Bell, Globe, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
});

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string().min(1, "Language is required"),
  timezone: z.string().min(1, "Timezone is required"),
  emailNotifications: z.boolean(),
  browserNotifications: z.boolean(),
  sessionTimeout: z.number().min(5, "Minimum 5 minutes").max(480, "Maximum 8 hours"),
});

const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function UserPreferences() {
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security">("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const trpc = useTRPC();

  const { data: currentUser, isLoading: userLoading } = useQuery(
    trpc.getCurrentUser.queryOptions({
      token: localStorage.getItem("auth-token") || "",
    })
  );

  const { data: userPreferences, isLoading: prefsLoading } = useQuery(
    trpc.getUserPreferences.queryOptions({
      token: localStorage.getItem("auth-token") || "",
    })
  );

  const updateProfile = useMutation(
    trpc.updateUserProfile.mutationOptions()
  );

  const updatePreferences = useMutation(
    trpc.updateUserPreferences.mutationOptions()
  );

  const updatePassword = useMutation(
    trpc.updateUserPassword.mutationOptions()
  );

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  if (userLoading || prefsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-6 w-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">User Preferences</h2>
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
        {activeTab === "profile" && (
          <ProfileSettings user={currentUser} onSave={updateProfile} />
        )}
        {activeTab === "preferences" && (
          <PreferencesSettings preferences={userPreferences} onSave={updatePreferences} />
        )}
        {activeTab === "security" && (
          <SecuritySettings 
            onSave={updatePassword}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
          />
        )}
      </div>
    </div>
  );
}

function ProfileSettings({ user, onSave }: { user: any; onSave: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      company: user?.company || "",
      title: user?.title || "",
      phone: user?.phone || "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        ...data,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Update your personal information and contact details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            {...register("firstName")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            {...register("lastName")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            {...register("email")}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            {...register("phone")}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <input
            {...register("company")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.company && (
            <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title
          </label>
          <input
            {...register("title")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={onSave.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {onSave.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}

function PreferencesSettings({ preferences, onSave }: { preferences: any; onSave: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: preferences?.theme || "light",
      language: preferences?.language || "en",
      timezone: preferences?.timezone || "UTC",
      emailNotifications: preferences?.emailNotifications ?? true,
      browserNotifications: preferences?.browserNotifications ?? false,
      sessionTimeout: preferences?.sessionTimeout || 30,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        ...data,
      });
      toast.success("Preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Preferences</h3>
        <p className="text-sm text-gray-600 mb-6">
          Customize your application experience and notification settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            {...register("theme")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          {errors.theme && (
            <p className="mt-1 text-sm text-red-600">{errors.theme.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            {...register("language")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
          </select>
          {errors.language && (
            <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            {...register("timezone")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Shanghai">Shanghai</option>
          </select>
          {errors.timezone && (
            <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
          )}
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
        <h4 className="text-md font-medium text-gray-900">Notifications</h4>
        
        <div className="flex items-center">
          <input
            {...register("emailNotifications")}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Email notifications for data room activity
          </label>
        </div>

        <div className="flex items-center">
          <input
            {...register("browserNotifications")}
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Browser notifications for real-time updates
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
          {onSave.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}

function SecuritySettings({ 
  onSave, 
  showCurrentPassword, 
  setShowCurrentPassword, 
  showNewPassword, 
  setShowNewPassword 
}: { 
  onSave: any;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(securitySchema),
  });

  const onSubmit = async (data: any) => {
    try {
      await onSave.mutateAsync({
        token: localStorage.getItem("auth-token") || "",
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated successfully");
      reset();
    } catch (error) {
      toast.error("Failed to update password");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Update your password and security preferences.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              {...register("currentPassword")}
              type={showCurrentPassword ? "text" : "password"}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              {...register("newPassword")}
              type={showNewPassword ? "text" : "password"}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            {...register("confirmPassword")}
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={onSave.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {onSave.isPending ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
