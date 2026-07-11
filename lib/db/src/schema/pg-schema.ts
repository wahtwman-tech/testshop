import { pgSchema } from "drizzle-orm/pg-core";

// Dedicated Postgres schema so this app's tables never collide with
// pre-existing tables/data living in the same external database.
export const appSchema = pgSchema("sheep_store");
