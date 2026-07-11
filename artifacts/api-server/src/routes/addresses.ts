import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, addressesTable } from "@workspace/db";
import {
  ListAddressesResponse,
  CreateAddressBody,
  CreateAddressResponse,
  UpdateAddressParams,
  UpdateAddressBody,
  UpdateAddressResponse,
  DeleteAddressParams,
} from "@workspace/api-zod";
import { requireCustomerAuth } from "../middlewares/auth";

const router: IRouter = Router();

function toApiAddress(row: typeof addressesTable.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get(
  "/addresses",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.userId, req.customerId!))
      .orderBy(addressesTable.id);
    res.json(ListAddressesResponse.parse(rows.map(toApiAddress)));
  },
);

router.post(
  "/addresses",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateAddressBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    if (parsed.data.isDefault) {
      await db
        .update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.userId, req.customerId!));
    }

    const [address] = await db
      .insert(addressesTable)
      .values({
        userId: req.customerId!,
        label: parsed.data.label,
        city: parsed.data.city,
        addressLine: parsed.data.addressLine,
        notes: parsed.data.notes ?? null,
        isDefault: parsed.data.isDefault ?? false,
      })
      .returning();

    res.status(201).json(CreateAddressResponse.parse(toApiAddress(address)));
  },
);

router.patch(
  "/addresses/:id",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const params = UpdateAddressParams.safeParse(req.params);
    const body = UpdateAddressBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
      return;
    }

    const [existing] = await db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.id, params.data.id),
          eq(addressesTable.userId, req.customerId!),
        ),
      );
    if (!existing) {
      res.status(404).json({ error: "العنوان غير موجود" });
      return;
    }

    if (body.data.isDefault) {
      await db
        .update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.userId, req.customerId!));
    }

    const [updated] = await db
      .update(addressesTable)
      .set(body.data)
      .where(eq(addressesTable.id, params.data.id))
      .returning();

    res.json(UpdateAddressResponse.parse(toApiAddress(updated)));
  },
);

router.delete(
  "/addresses/:id",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const params = DeleteAddressParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
      return;
    }

    const [existing] = await db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.id, params.data.id),
          eq(addressesTable.userId, req.customerId!),
        ),
      );
    if (!existing) {
      res.status(404).json({ error: "العنوان غير موجود" });
      return;
    }

    await db.delete(addressesTable).where(eq(addressesTable.id, params.data.id));
    res.status(204).send();
  },
);

export default router;
