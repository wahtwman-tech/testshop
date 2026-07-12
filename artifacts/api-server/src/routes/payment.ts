import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { ordersTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireCustomerAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia" as any,
});

// Get base URL from environment or use a default
const getBaseUrl = () => process.env.BASE_URL || "http://localhost:3000";

// Confirm order for Cash on Delivery
router.post("/cod", requireCustomerAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { orderId } = req.body as { orderId: number };

    if (!orderId) {
      res.status(400).json({ error: "Order ID is required" });
      return;
    }

    // Get order details
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Verify the order belongs to the current user
    if (order.userId !== userId) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    // Update order status to confirmed
    await db
      .update(ordersTable)
      .set({ 
        status: "confirmed",
        paymentMethod: "cod",
        updatedAt: new Date()
      })
      .where(eq(ordersTable.id, orderId));

    logger.info({ orderId }, "Order confirmed via COD");

    res.json({ success: true, orderId });
  } catch (error) {
    logger.error({ error }, "Failed to confirm COD order");
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

// Create Stripe Checkout Session
router.post("/create-checkout-session", requireCustomerAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { orderId } = req.body as { orderId: number };

    if (!orderId) {
      res.status(400).json({ error: "Order ID is required" });
      return;
    }

    // Get order details
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Verify the order belongs to the current user
    if (order.userId !== userId) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    // Get user details
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const baseUrl = getBaseUrl();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sar",
            product_data: {
              name: `طلب خروف #${order.id}`,
              description: `طلب رقم ${order.id} - ${order.quantity} خروف`,
            },
            unit_amount: Math.round(Number(order.totalAmount) * 100), // Convert to halalas
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/orders?payment=success&session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${baseUrl}/orders?payment=cancelled&order_id=${orderId}`,
      customer_email: user?.email || undefined,
      metadata: {
        orderId: orderId.toString(),
        userId: userId.toString(),
      },
    });

    logger.info({ sessionId: session.id, orderId }, "Stripe checkout session created");

    res.json({ url: session.url });
  } catch (error) {
    logger.error({ error }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Webhook to handle Stripe events
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For development without webhook signature
      event = req.body as Stripe.Event;
    }
  } catch (err) {
    logger.error({ error: err }, "Webhook signature verification failed");
    res.status(400).send("Webhook signature verification failed");
    return;
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db
          .update(ordersTable)
          .set({ 
            status: "confirmed",
            paymentMethod: "card",
            updatedAt: new Date()
          })
          .where(eq(ordersTable.id, parseInt(orderId)));

        logger.info({ orderId }, "Order confirmed via Stripe webhook");
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.warn({ paymentIntentId: paymentIntent.id }, "Payment failed");
      break;
    }

    default:
      logger.info({ eventType: event.type }, "Unhandled Stripe event");
  }

  res.json({ received: true });
});

// Verify payment status
router.get("/verify/:sessionId", requireCustomerAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await db
          .update(ordersTable)
          .set({ 
            status: "confirmed",
            paymentMethod: "card",
            updatedAt: new Date()
          })
          .where(eq(ordersTable.id, parseInt(orderId)));
      }
      res.json({ status: "paid", orderId: session.metadata?.orderId });
    } else {
      res.json({ status: session.payment_status });
    }
  } catch (error) {
    logger.error({ error }, "Failed to verify payment");
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;
