import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable, sheepTable, addressesTable, usersTable } from "@workspace/db";
import {
  CreateCheckoutBody,
  CreateCheckoutResponse,
  ListOrdersResponse,
  GetOrderParams,
  GetOrderResponse,
  PayOrderCodParams,
  PayOrderCodResponse,
  PayOrderCardParams,
  PayOrderCardResponse,
} from "@workspace/api-zod";
import { requireCustomerAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function loadOrderWithDetails(orderId: number, customerId: number) {
  const [row] = await db
    .select({
      order: ordersTable,
      sheep: sheepTable,
      address: addressesTable,
    })
    .from(ordersTable)
    .innerJoin(sheepTable, eq(ordersTable.sheepId, sheepTable.id))
    .innerJoin(addressesTable, eq(ordersTable.addressId, addressesTable.id))
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, customerId)));
  return row;
}

function toApiOrder(row: {
  order: typeof ordersTable.$inferSelect;
  sheep: typeof sheepTable.$inferSelect;
  address: typeof addressesTable.$inferSelect;
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
  };
}

router.post(
  "/checkout",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateCheckoutBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [customer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.customerId!));
    if (!customer?.emailVerified) {
      res.status(400).json({ error: "الرجاء تفعيل بريدك الإلكتروني قبل الطلب" });
      return;
    }

    const [sheep] = await db
      .select()
      .from(sheepTable)
      .where(eq(sheepTable.id, parsed.data.sheepId));
    if (!sheep) {
      res.status(404).json({ error: "المنتج غير موجود" });
      return;
    }
    if (sheep.stockQuantity < parsed.data.quantity) {
      res.status(400).json({ error: "الكمية المطلوبة غير متوفرة في المخزون" });
      return;
    }

    const [address] = await db
      .select()
      .from(addressesTable)
      .where(
        and(
          eq(addressesTable.id, parsed.data.addressId),
          eq(addressesTable.userId, req.customerId!),
        ),
      );
    if (!address) {
      res.status(404).json({ error: "العنوان غير موجود" });
      return;
    }

    const unitPrice = Number(sheep.price);
    const totalAmount = unitPrice * parsed.data.quantity;

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: req.customerId!,
        sheepId: sheep.id,
        addressId: address.id,
        quantity: parsed.data.quantity,
        unitPrice: unitPrice.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        note: parsed.data.note ?? null,
        status: "pending_payment",
      })
      .returning();

    const full = await loadOrderWithDetails(order.id, req.customerId!);
    res.status(201).json(CreateCheckoutResponse.parse(toApiOrder(full!)));
  },
);

router.get("/orders", requireCustomerAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({ order: ordersTable, sheep: sheepTable, address: addressesTable })
    .from(ordersTable)
    .innerJoin(sheepTable, eq(ordersTable.sheepId, sheepTable.id))
    .innerJoin(addressesTable, eq(ordersTable.addressId, addressesTable.id))
    .where(eq(ordersTable.userId, req.customerId!))
    .orderBy(ordersTable.id);

  res.json(ListOrdersResponse.parse(rows.map(toApiOrder)));
});

router.get("/orders/:id", requireCustomerAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }

  const full = await loadOrderWithDetails(params.data.id, req.customerId!);
  if (!full) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }

  res.json(GetOrderResponse.parse(toApiOrder(full)));
});

router.post(
  "/orders/:id/pay-cod",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const params = PayOrderCodParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
      return;
    }

    const full = await loadOrderWithDetails(params.data.id, req.customerId!);
    if (!full) {
      res.status(404).json({ error: "الطلب غير موجود" });
      return;
    }

    if (full.order.status === "pending_payment") {
      const [sheep] = await db
        .select()
        .from(sheepTable)
        .where(eq(sheepTable.id, full.order.sheepId));
      if (sheep && sheep.stockQuantity >= full.order.quantity) {
        const newStock = sheep.stockQuantity - full.order.quantity;
        await db
          .update(sheepTable)
          .set({ stockQuantity: newStock, available: newStock > 0 })
          .where(eq(sheepTable.id, sheep.id));
      }
    }

    await db
      .update(ordersTable)
      .set({ paymentMethod: "cash_on_delivery", status: "processing" })
      .where(eq(ordersTable.id, params.data.id));

    const updated = await loadOrderWithDetails(params.data.id, req.customerId!);
    res.json(PayOrderCodResponse.parse(toApiOrder(updated!)));
  },
);

router.post(
  "/orders/:id/pay-card",
  requireCustomerAuth,
  async (req, res): Promise<void> => {
    const params = PayOrderCardParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
      return;
    }

    const full = await loadOrderWithDetails(params.data.id, req.customerId!);
    if (!full) {
      res.status(404).json({ error: "الطلب غير موجود" });
      return;
    }

    await db
      .update(ordersTable)
      .set({ paymentMethod: "card" })
      .where(eq(ordersTable.id, params.data.id));

    const updated = await loadOrderWithDetails(params.data.id, req.customerId!);
    res.json(PayOrderCardResponse.parse(toApiOrder(updated!)));
  },
);

export default router;
