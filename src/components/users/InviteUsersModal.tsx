import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  X, 
  UserPlus, 
  Mail, 
  Users, 
  Shield, 
  Crown, 
  Star, 
  Eye, 
  Upload, 
  BarChart3,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";
import { Button } from "~/components/ui/Button";

const inviteSchema = z.object({
  emails: z.string().min(1, "At least one email is required"),
  role: z.enum(["ADMIN", "CONTRIBUTOR", "VIEWER", "AUDITOR"]),
  groupIds: z.array(z.number()).optional(),
  message: z.string().optional(),
  expiresInDays: z.number().min(1).max(30).default(7),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUsersModalProps {
  dataRoomId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RoleOption {
  value: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  permissions: string[];
}

const roleOptions: RoleOption[] = [
  {
    value: "ADMIN",
    label: "Admin",
    description: "Manages the room on behalf of the owner",
    icon: Star,
    color: "text-blue-600 bg-blue-100",
    permissions: [
      "View all files and folders",
      "Upload and organize documents", 
      "Invite and manage users",
      "Answer Q&A questions",
      "View audit logs and analytics"
    ]
  },
  {
    value: "CONTRIBUTOR", 
    label: "Contributor",
    description: "Can upload documents and organize folders",
    icon: Upload,
    color: "text-green-600 bg-green-100",
    permissions: [
      "View all files and folders",
      "Upload and organize documents",
      "Answer Q&A questions",
      "Add private notes"
    ]
  },
  {
    value: "VIEWER",
    label: "Viewer", 
    description: "Can only view files as permitted",
    icon: Eye,
    color: "text-gray-600 bg-gray-100",
    permissions: [
      "View permitted files",
      "Download files (if allowed)",
      "Ask Q&A questions", 
      "Add private notes",
      "Favorite files"
    ]
  },
  {
    value: "AUDITOR",
    label: "Auditor",
    description: "Read-only access to everything including activity logs", 
    icon: BarChart3,
    color: "text-orange-600 bg-orange-100",
    permissions: [
      "View all files and folders",
      "View audit logs and analytics",
      "Cannot download or print",
      "Always watermarked"
    ]
  }
];

// Step Components moved outside to avoid hooks violations
function EmailsStep({ 
  currentEmail, 
  setCurrentEmail, 
  emailList, 
  handleAddEmail, 
  handleRemoveEmail, 
  isValidEmail, 
  handleKeyPress 
}: {
  currentEmail: string;
  setCurrentEmail: (email: string) => void;
  emailList: string[];
  handleAddEmail: () => void;
  handleRemoveEmail: (email: string) => void;
  isValidEmail: (email: string) => boolean;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Add Email Addresses</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter the email addresses of users you want to invite to this data room.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <input
              type="email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button
            onClick={handleAddEmail}
            disabled={!currentEmail.trim() || !isValidEmail(currentEmail.trim())}
            className="px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {emailList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Email Addresses ({emailList.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {emailList.map((email) => (
                <div key={email} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleStep({ 
  selectedRole, 
  setSelectedRole, 
  roleOptions 
}: {
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  roleOptions: RoleOption[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Role</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the role that will be assigned to all invited users.
        </p>
      </div>

      <div className="space-y-3">
        {roleOptions.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.value}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedRole === role.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedRole(role.value)}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${role.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{role.label}</h4>
                    {selectedRole === role.value && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Permissions:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {role.permissions.map((permission, index) => (
                        <li key={index} className="flex items-center space-x-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupsStep({ 
  groups, 
  selectedGroups, 
  setSelectedGroups 
}: {
  groups: any[];
  selectedGroups: number[];
  setSelectedGroups: (groups: number[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Assign to Groups</h3>
        <p className="text-sm text-gray-600 mb-4">
          Optionally assign users to specific groups for organized access control.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No user groups available</p>
          <p className="text-sm text-gray-500 mt-1">
            You can create groups later to organize user access
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group: any) => (
            <div
              key={group.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedGroups.includes(group.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                if (selectedGroups.includes(group.id)) {
                  setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                } else {
                  setSelectedGroups([...selectedGroups, group.id]);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-600">{group.description}</p>
                  </div>
                </div>
                {selectedGroups.includes(group.id) && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({ 
  emailList, 
  selectedRoleInfo, 
  selectedGroups, 
  groups, 
  register, 
  inviteResults 
}: {
  emailList: string[];
  selectedRoleInfo: RoleOption;
  selectedGroups: number[];
  groups: any[];
  register: any;
  inviteResults: Array<{email: string, success: boolean, error?: string}>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Review & Send</h3>
        <p className="text-sm text-gray-600 mb-4">
          Review the invitation details before sending.
        </p>
      </div>

      <div className="space-y-4">
        {/* Email Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Recipients ({emailList.length})</h4>
          <div className="flex flex-wrap gap-2">
            {emailList.map((email) => (
              <span key={email} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {email}
              </span>
            ))}
          </div>
        </div>

        {/* Role Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Role Assignment</h4>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${selectedRoleInfo.color}`}>
              <selectedRoleInfo.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedRoleInfo.label}</p>
              <p className="text-sm text-gray-600">{selectedRoleInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Groups Summary */}
        {selectedGroups.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Group Assignments</h4>
            <div className="space-y-2">
              {selectedGroups.map((groupId) => {
                const group = groups.find((g: any) => g.id === groupId);
                return group ? (
                  <div key={groupId} className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{group.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Additional Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              {...register("message")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a personal message to the invitation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invitation Expires In (Days)
            </label>
            <select
              {...register("expiresInDays", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {inviteResults.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Invitation Results</h4>
          <div className="space-y-2">
            {inviteResults.map((result) => (
              <div key={result.email} className={`flex items-center space-x-2 p-2 rounded ${
                result.success ? "bg-green-50" : "bg-red-50"
              }`}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm text-gray-900">{result.email}</span>
                {result.error && (
                  <span className="text-xs text-red-600">- {result.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function InviteUsersModal({ dataRoomId, isOpen, onClose, onSuccess }: InviteUsersModalProps) {
  const [step, setStep] = useState<"emails" | "role" | "groups" | "review">("emails");
  const [selectedRole, setSelectedRole] = useState<string>("VIEWER");
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [inviteResults, setInviteResults] = useState<Array<{email: string, success: boolean, error?: string}>>([]);

  const token = useToken();
  const trpc = useTRPC();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "VIEWER",
      expiresInDays: 7,
    },
  });

  // Fetch user groups for this data room
  const userGroupsQuery = useQuery(
    trpc.getUserGroups.queryOptions({
      token: token!,
      dataRoomId,
    })
  );

  const sendInvitation = useMutation(trpc.sendDataRoomInvitation.mutationOptions());

  const groups = userGroupsQuery.data || [];
  const selectedRoleInfo = roleOptions.find(r => r.value === selectedRole) || roleOptions[2];

  const handleAddEmail = () => {
    const email = currentEmail.trim().toLowerCase();
    if (email && isValidEmail(email) && !emailList.includes(email)) {
      setEmailList([...emailList, email]);
      setCurrentEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailList(emailList.filter(email => email !== emailToRemove));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSendInvitations = async () => {
    if (!token || emailList.length === 0) return;

    const results: Array<{email: string, success: boolean, error?: string}> = [];
    
    for (const email of emailList) {
      try {
        await sendInvitation.mutateAsync({
          token,
          dataRoomId,
          email,
          role: selectedRole as any,
          groupIds: selectedGroups,
          message: watch("message"),
          expiresInDays: watch("expiresInDays"),
        });
        
        results.push({ email, success: true });
      } catch (error: any) {
        results.push({ 
          email, 
          success: false, 
          error: error.message || "Failed to send invitation"
        });
      }
    }

    setInviteResults(results);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      toast.success(`Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}`);
    }
    
    if (failureCount > 0) {
      toast.error(`Failed to send ${failureCount} invitation${failureCount > 1 ? 's' : ''}`);
    }

    if (successCount > 0 && onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    setStep("emails");
    setSelectedRole("VIEWER");
    setSelectedGroups([]);
    setEmailList([]);
    setCurrentEmail("");
    setInviteResults([]);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Invite Users</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {["emails", "role", "groups", "review"].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? "bg-blue-600 text-white" : 
                  ["emails", "role", "groups", "review"].indexOf(step) > index ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step === stepName ? "text-blue-600" : "text-gray-500"
                }`}>
                  {stepName === "emails" && "Emails"}
                  {stepName === "role" && "Role"}
                  {stepName === "groups" && "Groups"}
                  {stepName === "review" && "Review"}
                </span>
                {index < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === "emails" && (
            <EmailsStep 
              currentEmail={currentEmail}
              setCurrentEmail={setCurrentEmail}
              emailList={emailList}
              handleAddEmail={handleAddEmail}
              handleRemoveEmail={handleRemoveEmail}
              isValidEmail={isValidEmail}
              handleKeyPress={handleKeyPress}
            />
          )}
          {step === "role" && (
            <RoleStep 
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              roleOptions={roleOptions}
            />
          )}
          {step === "groups" && (
            <GroupsStep 
              groups={groups}
              selectedGroups={selectedGroups}
              setSelectedGroups={setSelectedGroups}
            />
          )}
          {step === "review" && (
            <ReviewStep 
              emailList={emailList}
              selectedRoleInfo={selectedRoleInfo}
              selectedGroups={selectedGroups}
              groups={groups}
              register={register}
              inviteResults={inviteResults}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {step !== "emails" && (
              <Button variant="outline" onClick={() => {
                const steps = ["emails", "role", "groups", "review"];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1] as any);
                }
              }}>
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            
            {step === "emails" && (
              <Button 
                onClick={() => setStep("role")}
                disabled={emailList.length === 0}
              >
                Next: Choose Role
              </Button>
            )}
            
            {step === "role" && (
              <Button onClick={() => setStep("groups")}>
                Next: Assign Groups
              </Button>
            )}
            
            {step === "groups" && (
              <Button onClick={() => setStep("review")}>
                Review & Send
              </Button>
            )}
            
            {step === "review" && (
              <Button 
                onClick={handleSendInvitations}
                disabled={sendInvitation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendInvitation.isPending ? "Sending..." : `Send ${emailList.length} Invitation${emailList.length > 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
