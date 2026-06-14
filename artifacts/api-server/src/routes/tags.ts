import { Router } from "express";
import { db } from "@workspace/db";
import { tagsTable, videoTagsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { slugify } from "../lib/slugify";

const router = Router();

router.get("/tags", async (req, res) => {
  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      createdAt: tagsTable.createdAt,
      videoCount: sql<number>`cast(count(${videoTagsTable.videoId}) as int)`,
    })
    .from(tagsTable)
    .leftJoin(videoTagsTable, eq(videoTagsTable.tagId, tagsTable.id))
    .groupBy(tagsTable.id)
    .orderBy(desc(tagsTable.createdAt));

  res.json(tags.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.post("/tags", async (req, res) => {
  const { name } = req.body as { name: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name required" }); return; }
  const slug = slugify(name);
  const [tag] = await db
    .insert(tagsTable)
    .values({ name: name.trim(), slug })
    .returning();
  res.status(201).json({ ...tag, videoCount: 0, createdAt: tag.createdAt.toISOString() });
});

router.get("/tags/slug/:slug", async (req, res) => {
  const { slug } = req.params;
  const rows = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      createdAt: tagsTable.createdAt,
      videoCount: sql<number>`cast(count(${videoTagsTable.videoId}) as int)`,
    })
    .from(tagsTable)
    .leftJoin(videoTagsTable, eq(videoTagsTable.tagId, tagsTable.id))
    .where(eq(tagsTable.slug, slug))
    .groupBy(tagsTable.id)
    .limit(1);
  if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...rows[0], createdAt: rows[0].createdAt.toISOString() });
});

router.get("/tags/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      createdAt: tagsTable.createdAt,
      videoCount: sql<number>`cast(count(${videoTagsTable.videoId}) as int)`,
    })
    .from(tagsTable)
    .leftJoin(videoTagsTable, eq(videoTagsTable.tagId, tagsTable.id))
    .where(eq(tagsTable.id, id))
    .groupBy(tagsTable.id)
    .limit(1);
  if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...rows[0], createdAt: rows[0].createdAt.toISOString() });
});

router.put("/tags/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name } = req.body as { name: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name required" }); return; }
  const slug = slugify(name);
  const [updated] = await db
    .update(tagsTable)
    .set({ name: name.trim(), slug })
    .where(eq(tagsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const rows = await db
    .select({ videoCount: sql<number>`cast(count(${videoTagsTable.videoId}) as int)` })
    .from(videoTagsTable)
    .where(eq(videoTagsTable.tagId, id));
  res.json({ ...updated, videoCount: rows[0]?.videoCount ?? 0, createdAt: updated.createdAt.toISOString() });
});

router.delete("/tags/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(tagsTable).where(eq(tagsTable.id, id));
  res.json({ success: true, message: "Tag deleted" });
});

export default router;
