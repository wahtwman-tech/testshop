import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { AdminListCustomersResponse } from "@workspace/api-zod";
import { requireAdminAuth } from "../middlewares/auth";
import { toApiUser } from "./auth";

const router: IRouter = Router();

router.get("/admin/customers", requireAdminAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(usersTable).orderBy(usersTable.id);
  res.json(AdminListCustomersResponse.parse(rows.map(toApiUser)));
});

export default router;
