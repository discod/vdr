import { minioClient } from "../minio";
import { db } from "../db";
import { hashPassword } from "../utils/auth";
import { env } from "../env";

async function setup() {
  // Create MinIO buckets
  const buckets = [
    { name: "vdr-documents", isPublic: false },
    { name: "vdr-public", isPublic: true },
  ];

  for (const bucket of buckets) {
    const bucketExists = await minioClient.bucketExists(bucket.name);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket.name);
      console.log(`Created bucket: ${bucket.name}`);
      
      if (bucket.isPublic) {
        // Set bucket policy for public read access
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucket.name}/*`],
            },
          ],
        };
        await minioClient.setBucketPolicy(bucket.name, JSON.stringify(policy));
        console.log(`Set public policy for bucket: ${bucket.name}`);
      }
    }
  }

  // Create default room templates
  const defaultTemplates = [
    {
      name: "M&A Due Diligence",
      type: "M&A",
      description: "Standard folder structure for M&A transactions",
      structure: JSON.stringify({
        folders: [
          { name: "01 - Corporate", children: ["Articles of Incorporation", "Bylaws", "Board Minutes"] },
          { name: "02 - Financial", children: ["Financial Statements", "Tax Returns", "Budgets"] },
          { name: "03 - Legal", children: ["Contracts", "Litigation", "IP"] },
          { name: "04 - HR", children: ["Employee Agreements", "Benefits", "Policies"] },
          { name: "05 - Operations", children: ["Facilities", "IT", "Vendors"] },
        ]
      }),
      isDefault: true,
    },
    {
      name: "Fundraising",
      type: "FUNDRAISING",
      description: "Standard folder structure for fundraising rounds",
      structure: JSON.stringify({
        folders: [
          { name: "01 - Company Overview", children: ["Pitch Deck", "Executive Summary", "Business Plan"] },
          { name: "02 - Financial Information", children: ["Financial Model", "Historical Financials", "Cap Table"] },
          { name: "03 - Legal Documents", children: ["Articles", "Stockholder Agreements", "Option Plans"] },
          { name: "04 - Market & Competition", children: ["Market Analysis", "Competitive Landscape"] },
          { name: "05 - Team", children: ["Management Bios", "Org Chart", "Advisory Board"] },
        ]
      }),
      isDefault: true,
    },
  ];

  for (const template of defaultTemplates) {
    const existing = await db.roomTemplate.findFirst({
      where: { name: template.name }
    });
    
    if (!existing) {
      await db.roomTemplate.create({
        data: template
      });
      console.log(`Created room template: ${template.name}`);
    }
  }

  // Create default permission templates
  const permissionTemplates = [
    {
      name: "Standard Admin",
      description: "Full administrative access for room management",
      role: "ADMIN",
      isDefault: true,
      isSystem: true,
      canView: true,
      canDownload: true,
      canPrint: true,
      canUpload: true,
      canEdit: true,
      canInvite: true,
      canManageQA: true,
      canViewAudit: true,
      canManageUsers: true,
      canManageGroups: false,
      canManageRoom: false,
      allowedCountries: [],
      sessionTimeout: 60,
    },
    {
      name: "Standard Contributor",
      description: "Can upload and organize documents",
      role: "CONTRIBUTOR",
      isDefault: true,
      isSystem: true,
      canView: true,
      canDownload: true,
      canPrint: true,
      canUpload: true,
      canEdit: false,
      canInvite: false,
      canManageQA: true,
      canViewAudit: false,
      canManageUsers: false,
      canManageGroups: false,
      canManageRoom: false,
      allowedCountries: [],
      sessionTimeout: 30,
    },
    {
      name: "Standard Viewer",
      description: "Basic viewing access with download permissions",
      role: "VIEWER",
      isDefault: true,
      isSystem: true,
      canView: true,
      canDownload: true,
      canPrint: true,
      canUpload: false,
      canEdit: false,
      canInvite: false,
      canManageQA: false,
      canViewAudit: false,
      canManageUsers: false,
      canManageGroups: false,
      canManageRoom: false,
      allowedCountries: [],
      sessionTimeout: 30,
    },
    {
      name: "Restricted Viewer",
      description: "View-only access without download permissions",
      role: "VIEWER",
      isDefault: false,
      isSystem: true,
      canView: true,
      canDownload: false,
      canPrint: false,
      canUpload: false,
      canEdit: false,
      canInvite: false,
      canManageQA: false,
      canViewAudit: false,
      canManageUsers: false,
      canManageGroups: false,
      canManageRoom: false,
      allowedCountries: [],
      sessionTimeout: 15,
    },
    {
      name: "Standard Auditor",
      description: "Read-only access with audit capabilities",
      role: "AUDITOR",
      isDefault: true,
      isSystem: true,
      canView: true,
      canDownload: false,
      canPrint: false,
      canUpload: false,
      canEdit: false,
      canInvite: false,
      canManageQA: false,
      canViewAudit: true,
      canManageUsers: false,
      canManageGroups: false,
      canManageRoom: false,
      allowedCountries: [],
      sessionTimeout: 60,
    },
    {
      name: "Finance Team",
      description: "Specialized access for financial due diligence",
      role: "CONTRIBUTOR",
      isDefault: false,
      isSystem: false,
      canView: true,
      canDownload: true,
      canPrint: true,
      canUpload: true,
      canEdit: false,
      canInvite: false,
      canManageQA: true,
      canViewAudit: false,
      canManageUsers: false,
      canManageGroups: false,
      canManageRoom: false,
      allowedCountries: [],
      sessionTimeout: 45,
    },
    {
      name: "Legal Team",
      description: "Specialized access for legal due diligence",
      role: "CONTRIBUTOR",
      isDefault: false,
      isSystem: false,
      canView: true,
      canDownload: true,
      canPrint: true,
      canUpload: true,
      canEdit: false,
      canInvite: false,
      canManageQA: true,
      canViewAudit: false,
      canManageUsers: false,
      canManageGroups: false,
      canManageRoom: false,
      allowedCountries: [],
      sessionTimeout: 45,
    },
  ];

  for (const template of permissionTemplates) {
    const existing = await db.permissionTemplate.findFirst({
      where: { name: template.name }
    });
    
    if (!existing) {
      await db.permissionTemplate.create({
        data: template
      });
      console.log(`Created permission template: ${template.name}`);
    }
  }

  // Create default system settings
  const systemSettings = [
    {
      key: "REQUIRE_TWO_FACTOR",
      value: "false",
      description: "Require two-factor authentication for all users",
      category: "SECURITY",
    },
    {
      key: "ALLOW_REGISTRATION",
      value: "false",
      description: "Allow users to register without invitation",
      category: "SECURITY",
    },
    {
      key: "DEFAULT_SESSION_TIMEOUT",
      value: "30",
      description: "Default session timeout in minutes",
      category: "SECURITY",
    },
    {
      key: "MAX_FILE_SIZE",
      value: "104857600", // 100MB
      description: "Maximum file size in bytes",
      category: "GENERAL",
    },
    {
      key: "COMPANY_NAME",
      value: "VaultSpace",
      description: "Company name for branding",
      category: "BRANDING",
    },
    {
      key: "SUPPORT_EMAIL",
      value: "support@vaultspace.com",
      description: "Support email address",
      category: "GENERAL",
    },
  ];

  for (const setting of systemSettings) {
    const existing = await db.systemSettings.findUnique({
      where: { key: setting.key }
    });
    
    if (!existing) {
      await db.systemSettings.create({
        data: setting
      });
      console.log(`Created system setting: ${setting.key}`);
    }
  }

  // Create super admin user
  const adminEmail = "admin@dataroom.com";
  const existingAdmin = await db.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    // Create the super admin user
    const hashedPassword = await hashPassword(env.ADMIN_PASSWORD);
    
    const adminUser = await db.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        company: "System",
        title: "Administrator",
        isActive: true,
        isEmailVerified: true,
        isSuperAdmin: true, // Mark as system super admin
      }
    });

    // Create a system administration data room
    const adminDataRoom = await db.dataRoom.create({
      data: {
        name: "System Administration",
        description: "Administrative data room for system management",
        type: "CUSTOM",
        status: "ACTIVE",
        creatorId: adminUser.id,
        allowDownload: true,
        allowPrint: true,
        allowCopyPaste: true,
        watermarkEnabled: false,
        requireNDA: false,
      }
    });

    // Grant ROOM_OWNER access to the system administration data room with all permissions
    await db.userRoomAccess.create({
      data: {
        userId: adminUser.id,
        dataRoomId: adminDataRoom.id,
        role: "ROOM_OWNER",
        canView: true,
        canDownload: true,
        canPrint: true,
        canUpload: true,
        canEdit: true,
        canInvite: true,
        canManageQA: true,
        canViewAudit: true,
        canManageUsers: true,
        canManageGroups: true,
        canManageRoom: true,
      }
    });

    console.log(`Created super admin user: ${adminEmail}`);
    console.log(`Admin can login at: /auth/login`);
    console.log(`Admin email: ${adminEmail}`);
    console.log(`Admin password: ${env.ADMIN_PASSWORD}`);
  } else {
    console.log(`Super admin user already exists: ${adminEmail}`);
  }
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
