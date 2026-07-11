import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, siteContentTable } from "@workspace/db";
import {
  AdminListContentResponse,
  AdminUpdateContentBody,
  AdminUpdateContentResponse,
} from "@workspace/api-zod";
import { requireAdminAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/content", requireAdminAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteContentTable);
  res.json(
    AdminListContentResponse.parse(rows.map(({ key, value }) => ({ key, value }))),
  );
});

router.put("/admin/content", requireAdminAuth, async (req, res): Promise<void> => {
  const parsed = AdminUpdateContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  for (const item of parsed.data) {
    await db
      .insert(siteContentTable)
      .values({ key: item.key, value: item.value })
      .onConflictDoUpdate({
        target: siteContentTable.key,
        set: { value: item.value, updatedAt: sql`now()` },
      });
  }

  const rows = await db.select().from(siteContentTable);
  res.json(
    AdminUpdateContentResponse.parse(rows.map(({ key, value }) => ({ key, value }))),
  );
});

export default router;
