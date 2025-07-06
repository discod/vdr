import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const getRoomTemplates = baseProcedure
  .query(async () => {
    const templates = await db.roomTemplate.findMany({
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    });

    return templates;
  });
