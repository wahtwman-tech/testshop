import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, sheepTable, addressesTable, usersTable } from "@workspace/db";
import {
  AdminListOrdersResponse,
  AdminUpdateOrderParams,
  AdminUpdateOrderBody,
  AdminUpdateOrderResponse,
} from "@workspace/api-zod";
import { requireAdminAuth } from "../middlewares/auth";

const router: IRouter = Router();

function toApiAdminOrder(row: {
  order: typeof ordersTable.$inferSelect;
  sheep: typeof sheepTable.$inferSelect;
  address: typeof addressesTable.$inferSelect;
  customer: typeof usersTable.$inferSelect;
}) {
  return {
    id: row.order.id,
    sheepId: row.order.sheepId,
    addressId: row.order.addressId,
    quantity: row.order.quantity,
    unitPrice: Number(row.order.unitPrice),
    totalAmount: Number(row.order.totalAmount),
    paymentMethod: row.order.paymentMethod,
    note: row.order.note,
    status: row.order.status,
    createdAt: row.order.createdAt.toISOString(),
    updatedAt: row.order.updatedAt.toISOString(),
    sheep: {
      id: row.sheep.id,
      name: row.sheep.name,
      imageUrl: row.sheep.imageUrl,
      breed: row.sheep.breed,
    },
    address: {
      id: row.address.id,
      label: row.address.label,
      city: row.address.city,
      addressLine: row.address.addressLine,
    },
    customer: {
      id: row.customer.id,
      name: row.customer.name,
      phone: row.customer.phone,
      email: row.customer.email,
    },
  };
}

router.get("/admin/orders", requireAdminAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      order: ordersTable,
      sheep: sheepTable,
      address: addressesTable,
      customer: usersTable,
    })
    .from(ordersTable)
    .innerJoin(sheepTable, eq(ordersTable.sheepId, sheepTable.id))
    .innerJoin(addressesTable, eq(ordersTable.addressId, addressesTable.id))
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .orderBy(ordersTable.id);

  res.json(AdminListOrdersResponse.parse(rows.map(toApiAdminOrder)));
});

router.patch("/admin/orders/:id", requireAdminAuth, async (req, res): Promise<void> => {
  const params = AdminUpdateOrderParams.safeParse(req.params);
  const body = AdminUpdateOrderBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }

  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }

  await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.id, params.data.id));

  const [row] = await db
    .select({
      order: ordersTable,
      sheep: sheepTable,
      address: addressesTable,
      customer: usersTable,
    })
    .from(ordersTable)
    .innerJoin(sheepTable, eq(ordersTable.sheepId, sheepTable.id))
    .innerJoin(addressesTable, eq(ordersTable.addressId, addressesTable.id))
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(eq(ordersTable.id, params.data.id));

  res.json(AdminUpdateOrderResponse.parse(toApiAdminOrder(row!)));
});

export default router;
