import {
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { appSchema } from "./pg-schema";

export const sheepTable = appSchema.table("sheep", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  breed: text("breed").notNull(),
  ageMonths: integer("age_months").notNull(),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  available: boolean("available").notNull().default(true),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSheepSchema = createInsertSchema(sheepTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSheep = z.infer<typeof insertSheepSchema>;
export type Sheep = typeof sheepTable.$inferSelect;
