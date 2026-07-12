import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sheepTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

// Map of feminine sheep names to masculine
const SHEEP_NAME_FIXES: Record<string, string> = {
  "نجدية": "نجدي",
  "نعيمية": "نعيمي",
  "حجازية": "حجازي",
  "سودانية": "سوداني",
  "مغربية": "مغربي",
  "جزائرية": "جزائري",
  "ليبية": "ليبي",
  "تونسية": "تونسي",
  "مصرية": "مصري",
  "عراقية": "عراقي",
  "سورية": "سوري",
  "أردنية": "أردني",
  "لبنانية": "لبناني",
  "فلسطينية": "فلسطيني",
  "كويتية": "كويتي",
  "بحرينية": "بحريني",
  "عمانية": "عماني",
  "يمنية": "يمني",
  "قطيفية": "قطيفي",
  "شامية": "شامي",
  "يمانية": "يماني",
  "عسلاية": "عسلاوي",
  "حائلية": "حائلي",
  "مكية": "مكي",
  "طائفية": "طائفي",
  "تبوكية": "تبوكي",
  "أبهاية": "أبهاوي",
  "نجرانية": "نجراني",
  "القصيمية": "قصيمي",
  "الوسطى": "وسطي",
  "الغربية": "غربي",
  "الشرقية": "شرقي",
  "الشمالية": "شمالي",
  "الجنوبية": "جنوبي",
};

// Update all sheep names from feminine to masculine
router.post("/fix-names", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    // Get all sheep
    const allSheep = await db.select().from(sheepTable);
    
    let updatedCount = 0;
    
    for (const sheep of allSheep) {
      const fixedName = SHEEP_NAME_FIXES[sheep.name];
      if (fixedName && sheep.name !== fixedName) {
        await db
          .update(sheepTable)
          .set({ name: fixedName })
          .where(eq(sheepTable.id, sheep.id));
        updatedCount++;
        logger.info({ sheepId: sheep.id, oldName: sheep.name, newName: fixedName }, "Fixed sheep name");
      }
    }
    
    res.json({ 
      success: true, 
      message: `تم تحديث ${updatedCount} اسم بنجاح`,
      updatedCount 
    });
  } catch (error) {
    logger.error({ error }, "Failed to fix sheep names");
    res.status(500).json({ error: "فشل في تحديث الأسماء" });
  }
});

export default router;
