import {
  createCallerFactory,
  createTRPCRouter,
  baseProcedure,
} from "~/server/trpc/main";
import { register } from "./procedures/register";
import { login } from "./procedures/login";
import { getCurrentUser } from "./procedures/getCurrentUser";
import { createDataRoom } from "./procedures/createDataRoom";
import { getDataRooms } from "./procedures/getDataRooms";
import { getDataRoom } from "./procedures/getDataRoom";
import { getRoomTemplates } from "./procedures/getRoomTemplates";
import { getMinioBaseUrl } from "./procedures/getMinioBaseUrl";
import { generatePresignedUrl } from "./procedures/generatePresignedUrl";
import { confirmFileUpload } from "./procedures/confirmFileUpload";
import { moveFile } from "./procedures/moveFile";
import { createQuestion } from "./procedures/createQuestion";
import { getQuestions } from "./procedures/getQuestions";
import { answerQuestion } from "./procedures/answerQuestion";
import { getAnalytics } from "./procedures/getAnalytics";
import { getAllUsers } from "./procedures/getAllUsers";
import { impersonateUser } from "./procedures/impersonateUser";
import { searchFiles } from "./procedures/searchFiles";
import { getDocumentContent } from "./procedures/getDocumentContent";
import { getDocumentNotes } from "./procedures/getDocumentNotes";
import { createDocumentNote } from "./procedures/createDocumentNote";
import { getSystemSettings } from "./procedures/getSystemSettings";
import { updateSystemSettings } from "./procedures/updateSystemSettings";
import { getUserPreferences } from "./procedures/getUserPreferences";
import { updateUserPreferences } from "./procedures/updateUserPreferences";
import { updateUserProfile } from "./procedures/updateUserProfile";
import { updateUserPassword } from "./procedures/updateUserPassword";
import { generateFileShareLink } from "./procedures/generateFileShareLink";
import { sendFileInvitation } from "./procedures/sendFileInvitation";
import { getFileShares } from "./procedures/getFileShares";
import { revokeFileShareLink } from "./procedures/revokeFileShareLink";
import { generateFolderShareLink } from "./procedures/generateFolderShareLink";
import { sendFolderInvitation } from "./procedures/sendFolderInvitation";
import { getFolderShares } from "./procedures/getFolderShares";
import { revokeFolderShareLink } from "./procedures/revokeFolderShareLink";
import { updateDataRoomSettings } from "./procedures/updateDataRoomSettings";
import { sendDataRoomInvitation } from "./procedures/sendDataRoomInvitation";
import { getRecentActivity } from "./procedures/getRecentActivity";
import { toggleFileFavorite } from "./procedures/toggleFileFavorite";
import { getUserFavorites } from "./procedures/getUserFavorites";
import { requestAccess } from "./procedures/requestAccess";
import { getAccessRequests } from "./procedures/getAccessRequests";
import { reviewAccessRequest } from "./procedures/reviewAccessRequest";
import { getFolderContents } from "./procedures/getFolderContents";
import { createUserGroup } from "./procedures/createUserGroup";
import { getUserGroups } from "./procedures/getUserGroups";
import { manageUserGroupMembership } from "./procedures/manageUserGroupMembership";
import { updateUserPermissions } from "./procedures/updateUserPermissions";

export const appRouter = createTRPCRouter({
  // Authentication
  register,
  login,
  getCurrentUser,
  
  // Data Room Management
  createDataRoom,
  getDataRooms,
  getDataRoom,
  getRoomTemplates,
  
  // Access Requests
  requestAccess,
  getAccessRequests,
  reviewAccessRequest,
  
  // File Operations
  getMinioBaseUrl,
  generatePresignedUrl,
  confirmFileUpload,
  moveFile,
  getDocumentContent,
  
  // Folder Operations
  getFolderContents,
  
  // Q&A System
  createQuestion,
  getQuestions,
  answerQuestion,
  
  // Analytics
  getAnalytics,
  
  // Admin Functions
  getAllUsers,
  impersonateUser,
  
  // User Group Management
  createUserGroup,
  getUserGroups,
  manageUserGroupMembership,
  updateUserPermissions,
  
  // Search
  searchFiles,
  
  // Document Notes
  getDocumentNotes,
  createDocumentNote,
  
  // System Settings (Super Admin)
  getSystemSettings,
  updateSystemSettings,
  
  // User Preferences
  getUserPreferences,
  updateUserPreferences,
  updateUserProfile,
  updateUserPassword,
  
  // File Sharing
  generateFileShareLink,
  sendFileInvitation,
  getFileShares,
  revokeFileShareLink,
  
  // Folder Sharing
  generateFolderShareLink,
  sendFolderInvitation,
  getFolderShares,
  revokeFolderShareLink,
  
  // Data Room Settings
  updateDataRoomSettings,
  
  // Data Room Invitations
  sendDataRoomInvitation,
  
  // Activity Monitoring
  getRecentActivity,
  
  // File Favorites
  toggleFileFavorite,
  getUserFavorites,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
