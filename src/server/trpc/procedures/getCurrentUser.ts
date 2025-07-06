import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getCurrentUser = baseProcedure
  .input(z.object({ authToken: z.string() }))
  .query(async ({ input }) => {
    const user = await authenticateUser(input.authToken);
    return user;
  });
