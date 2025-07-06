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

    // Grant admin access to the system administration data room
    await db.userRoomAccess.create({
      data: {
        userId: adminUser.id,
        dataRoomId: adminDataRoom.id,
        role: "ADMIN",
        canView: true,
        canDownload: true,
        canPrint: true,
        canUpload: true,
        canEdit: true,
        canInvite: true,
        canManageQA: true,
        canViewAudit: true,
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
