import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sheepTable } from "@workspace/db";
import {
  ListSheepResponse,
  GetSheepParams,
  GetSheepResponse,
  GetSheepStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApiSheep(row: typeof sheepTable.$inferSelect) {
  return {
    ...row,
    weightKg: Number(row.weightKg),
    price: Number(row.price),
  };
}

router.get("/sheep", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(sheepTable)
    .orderBy(sheepTable.id);
  res.json(ListSheepResponse.parse(rows.map(toApiSheep)));
});

router.get("/sheep/stats/summary", async (_req, res): Promise<void> => {
  const rows = await db.select().from(sheepTable);

  const totalSheep = rows.length;
  const availableSheep = rows.filter((s) => s.available).length;
  const prices = rows.map((s) => Number(s.price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const breedCounts = new Map<string, number>();
  for (const s of rows) {
    breedCounts.set(s.breed, (breedCounts.get(s.breed) ?? 0) + 1);
  }
  const breedBreakdown = Array.from(breedCounts.entries()).map(
    ([breed, count]) => ({ breed, count }),
  );

  res.json(
    GetSheepStatsResponse.parse({
      totalSheep,
      availableSheep,
      minPrice,
      maxPrice,
      breedBreakdown,
    }),
  );
});

router.get("/sheep/:id", async (req, res): Promise<void> => {
  const params = GetSheepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sheep] = await db
    .select()
    .from(sheepTable)
    .where(eq(sheepTable.id, params.data.id));

  if (!sheep) {
    res.status(404).json({ error: "Sheep not found" });
    return;
  }

  res.json(GetSheepResponse.parse(toApiSheep(sheep)));
});

export default router;
