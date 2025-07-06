import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTRPC } from "~/trpc/react";
import { useToken } from "~/stores/auth";
import { Button } from "~/components/ui/Button";
import { Calendar, FileText, Settings, Shield } from "lucide-react";

const createDataRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional(),
  type: z.enum(["M&A", "FUNDRAISING", "IPO", "AUDIT", "LEGAL", "CUSTOM"]),
  templateId: z.number().optional(),
  expiresAt: z.string().optional(),
  allowDownload: z.boolean().default(true),
  allowPrint: z.boolean().default(true),
  allowCopyPaste: z.boolean().default(false),
  watermarkEnabled: z.boolean().default(true),
  requireNDA: z.boolean().default(false),
});

type CreateDataRoomFormData = z.infer<typeof createDataRoomSchema>;

interface CreateDataRoomFormProps {
  onSuccess: (dataRoom: any) => void;
}

export function CreateDataRoomForm({ onSuccess }: CreateDataRoomFormProps) {
  const [step, setStep] = useState(1);
  const token = useToken();
  const trpc = useTRPC();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDataRoomFormData>({
    resolver: zodResolver(createDataRoomSchema),
    defaultValues: {
      allowDownload: true,
      allowPrint: true,
      allowCopyPaste: false,
      watermarkEnabled: true,
      requireNDA: false,
    },
  });

  const selectedType = watch("type");
  const selectedTemplateId = watch("templateId");

  // Fetch room templates
  const templatesQuery = useQuery(trpc.getRoomTemplates.queryOptions());

  const createMutation = useMutation(trpc.createDataRoom.mutationOptions({
    onSuccess: (data) => {
      toast.success("Data room created successfully!");
      onSuccess(data);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create data room");
    },
  }));

  const onSubmit = (data: CreateDataRoomFormData) => {
    const payload = {
      ...data,
      authToken: token!,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      settings: {
        allowDownload: data.allowDownload,
        allowPrint: data.allowPrint,
        allowCopyPaste: data.allowCopyPaste,
        watermarkEnabled: data.watermarkEnabled,
        requireNDA: data.requireNDA,
      },
    };

    createMutation.mutate(payload);
  };

  const filteredTemplates = templatesQuery.data?.filter(
    (template) => !selectedType || template.type === selectedType
  ) || [];

  return (
    <div className="bg-white shadow-lg rounded-lg">
      {/* Progress steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Basic Info</span>
          </div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Template</span>
          </div>
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Settings</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Project Alpha M&A"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    {...register("description")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the data room purpose"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Room Type *
                  </label>
                  <select
                    id="type"
                    {...register("type")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a type</option>
                    <option value="M&A">M&A Due Diligence</option>
                    <option value="FUNDRAISING">Fundraising</option>
                    <option value="IPO">IPO</option>
                    <option value="AUDIT">Audit</option>
                    <option value="LEGAL">Legal</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    id="expiresAt"
                    type="date"
                    {...register("expiresAt")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!watch("name") || !watch("type")}
              >
                Next: Choose Template
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Template</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select a pre-built folder structure or start with a blank room
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Blank template option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    !selectedTemplateId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setValue("templateId", undefined)}
                >
                  <div className="flex items-center mb-3">
                    <FileText className="h-6 w-6 text-gray-400 mr-3" />
                    <h4 className="font-medium text-gray-900">Blank Room</h4>
                  </div>
                  <p className="text-sm text-gray-600">Start with an empty room and create your own structure</p>
                </div>

                {/* Template options */}
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplateId === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setValue("templateId", template.id)}
                  >
                    <div className="flex items-center mb-3">
                      <FileText className="h-6 w-6 text-blue-500 mr-3" />
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
              >
                Next: Configure Settings
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security & Access Settings</h3>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Document Access
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register("allowDownload")}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow document downloads</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register("allowPrint")}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow document printing</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register("allowCopyPaste")}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Allow copy/paste from documents</span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Security Features
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register("watermarkEnabled")}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable dynamic watermarks</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...register("requireNDA")}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require NDA acceptance</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? "Creating..." : "Create Data Room"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
