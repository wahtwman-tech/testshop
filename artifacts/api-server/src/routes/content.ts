import { Router, type IRouter } from "express";
import { db, siteContentTable } from "@workspace/db";
import { ListContentResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/content", async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteContentTable);
  res.json(ListContentResponse.parse(rows.map(({ key, value }) => ({ key, value }))));
});

export default router;
