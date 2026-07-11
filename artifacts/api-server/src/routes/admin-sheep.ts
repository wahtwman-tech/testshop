import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sheepTable } from "@workspace/db";
import {
  AdminListSheepResponse,
  AdminCreateSheepBody,
  AdminCreateSheepResponse,
  AdminUpdateSheepParams,
  AdminUpdateSheepBody,
  AdminUpdateSheepResponse,
  AdminDeleteSheepParams,
} from "@workspace/api-zod";
import { requireAdminAuth } from "../middlewares/auth";

const router: IRouter = Router();

function toApiSheep(row: typeof sheepTable.$inferSelect) {
  return {
    ...row,
    weightKg: Number(row.weightKg),
    price: Number(row.price),
  };
}

router.get("/admin/sheep", requireAdminAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(sheepTable).orderBy(sheepTable.id);
  res.json(AdminListSheepResponse.parse(rows.map(toApiSheep)));
});

router.post("/admin/sheep", requireAdminAuth, async (req, res): Promise<void> => {
  const parsed = AdminCreateSheepBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sheep] = await db
    .insert(sheepTable)
    .values({
      name: parsed.data.name,
      breed: parsed.data.breed,
      ageMonths: parsed.data.ageMonths,
      weightKg: parsed.data.weightKg.toFixed(2),
      price: parsed.data.price.toFixed(2),
      imageUrl: parsed.data.imageUrl,
      description: parsed.data.description,
      stockQuantity: parsed.data.stockQuantity,
      available: parsed.data.stockQuantity > 0,
    })
    .returning();

  res.status(201).json(AdminCreateSheepResponse.parse(toApiSheep(sheep)));
});

router.patch("/admin/sheep/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const params = AdminUpdateSheepParams.safeParse(req.params);
  const body = AdminUpdateSheepBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }

  const [existing] = await db
    .select()
    .from(sheepTable)
    .where(eq(sheepTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  const updates: Partial<typeof sheepTable.$inferInsert> = {};
  if (body.data.name !== undefined) updates.name = body.data.name;
  if (body.data.breed !== undefined) updates.breed = body.data.breed;
  if (body.data.ageMonths !== undefined) updates.ageMonths = body.data.ageMonths;
  if (body.data.weightKg !== undefined) updates.weightKg = body.data.weightKg.toFixed(2);
  if (body.data.price !== undefined) updates.price = body.data.price.toFixed(2);
  if (body.data.imageUrl !== undefined) updates.imageUrl = body.data.imageUrl;
  if (body.data.description !== undefined) updates.description = body.data.description;
  if (body.data.stockQuantity !== undefined) {
    updates.stockQuantity = body.data.stockQuantity;
    updates.available = body.data.stockQuantity > 0;
  }

  const [updated] = await db
    .update(sheepTable)
    .set(updates)
    .where(eq(sheepTable.id, params.data.id))
    .returning();

  res.json(AdminUpdateSheepResponse.parse(toApiSheep(updated)));
});

router.delete("/admin/sheep/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const params = AdminDeleteSheepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }

  const [existing] = await db
    .select()
    .from(sheepTable)
    .where(eq(sheepTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "المنتج غير موجود" });
    return;
  }

  await db.delete(sheepTable).where(eq(sheepTable.id, params.data.id));
  res.status(204).send();
});

export default router;
