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
import { updateDataRoomSettings } from "./procedures/updateDataRoomSettings";

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
  
  // File Operations
  getMinioBaseUrl,
  generatePresignedUrl,
  confirmFileUpload,
  getDocumentContent,
  
  // Q&A System
  createQuestion,
  getQuestions,
  answerQuestion,
  
  // Analytics
  getAnalytics,
  
  // Admin Functions
  getAllUsers,
  impersonateUser,
  
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
  
  // Data Room Settings
  updateDataRoomSettings,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
