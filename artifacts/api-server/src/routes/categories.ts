import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, videosTable, videoTagsTable, tagsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { slugify } from "../lib/slugify";

const router = Router();

router.get("/categories", async (req, res) => {
  const cats = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      createdAt: categoriesTable.createdAt,
      videoCount: sql<number>`cast(count(${videosTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(videosTable, eq(videosTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(desc(categoriesTable.createdAt));

  res.json(cats.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.post("/categories", async (req, res) => {
  const { name } = req.body as { name: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "Name required" });
    return;
  }
  const slug = slugify(name);
  const [cat] = await db
    .insert(categoriesTable)
    .values({ name: name.trim(), slug })
    .returning();
  res.status(201).json({ ...cat, videoCount: 0, createdAt: cat.createdAt.toISOString() });
});

router.get("/categories/slug/:slug", async (req, res) => {
  const { slug } = req.params;
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      createdAt: categoriesTable.createdAt,
      videoCount: sql<number>`cast(count(${videosTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(videosTable, eq(videosTable.categoryId, categoriesTable.id))
    .where(eq(categoriesTable.slug, slug))
    .groupBy(categoriesTable.id)
    .limit(1);
  if (!rows.length) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const cat = rows[0];
  res.json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

router.get("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      createdAt: categoriesTable.createdAt,
      videoCount: sql<number>`cast(count(${videosTable.id}) as int)`,
    })
    .from(categoriesTable)
    .leftJoin(videosTable, eq(videosTable.categoryId, categoriesTable.id))
    .where(eq(categoriesTable.id, id))
    .groupBy(categoriesTable.id)
    .limit(1);
  if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
  const cat = rows[0];
  res.json({ ...cat, createdAt: cat.createdAt.toISOString() });
});

router.put("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name } = req.body as { name: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name required" }); return; }
  const slug = slugify(name);
  const [updated] = await db
    .update(categoriesTable)
    .set({ name: name.trim(), slug })
    .where(eq(categoriesTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const rows = await db
    .select({ videoCount: sql<number>`cast(count(${videosTable.id}) as int)` })
    .from(videosTable)
    .where(eq(videosTable.categoryId, id));
  res.json({ ...updated, videoCount: rows[0]?.videoCount ?? 0, createdAt: updated.createdAt.toISOString() });
});

router.delete("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json({ success: true, message: "Category deleted" });
});

export default router;
