import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, videoTagsTable, categoriesTable, tagsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import { slugify } from "../lib/slugify";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

router.post("/admin/verify", async (req, res) => {
  const { password } = req.body as { password: string };
  if (password === ADMIN_PASSWORD) {
    const token = Buffer.from(`admin:${Date.now()}`).toString("base64");
    res.json({ ok: true, token });
  } else {
    res.status(401).json({ ok: false, token: "" });
  }
});

async function upsertVideoTags(videoId: number, tagIds: number[]) {
  await db.delete(videoTagsTable).where(eq(videoTagsTable.videoId, videoId));
  if (tagIds.length) {
    await db.insert(videoTagsTable).values(tagIds.map(tagId => ({ videoId, tagId })));
  }
}

function toSlug(title: string, id: number): string {
  return `${slugify(title)}-${id}`;
}

router.post("/admin/videos", async (req, res) => {
  const body = req.body as {
    title: string;
    thumbnail: string;
    videoUrl: string;
    previewUrl?: string | null;
    duration: string;
    is4k?: boolean;
    description?: string | null;
    channel?: string | null;
    categoryId?: number | null;
    tagIds?: number[];
  };

  const [video] = await db
    .insert(videosTable)
    .values({
      title: body.title,
      slug: slugify(body.title) + "-" + Date.now(),
      thumbnail: body.thumbnail,
      videoUrl: body.videoUrl,
      previewUrl: body.previewUrl ?? null,
      duration: body.duration,
      is4k: body.is4k ?? false,
      description: body.description ?? null,
      channel: body.channel ?? null,
      categoryId: body.categoryId ?? null,
    })
    .returning();

  const finalSlug = toSlug(video.title, video.id);
  await db.update(videosTable).set({ slug: finalSlug }).where(eq(videosTable.id, video.id));

  const tagIds = body.tagIds ?? [];
  await upsertVideoTags(video.id, tagIds);

  let categoryName: string | null = null;
  let categorySlug: string | null = null;
  if (video.categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, video.categoryId)).limit(1);
    if (cats.length) { categoryName = cats[0].name; categorySlug = cats[0].slug; }
  }

  const tags = tagIds.length
    ? (await db.select().from(tagsTable).where(inArray(tagsTable.id, tagIds)))
        .map(t => ({ ...t, videoCount: 0, createdAt: t.createdAt.toISOString() }))
    : [];

  res.status(201).json({
    ...video,
    slug: finalSlug,
    categoryName,
    categorySlug,
    tags,
    createdAt: video.createdAt.toISOString(),
  });
});

router.put("/admin/videos/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = req.body as {
    title?: string | null;
    thumbnail?: string | null;
    videoUrl?: string | null;
    previewUrl?: string | null;
    duration?: string | null;
    is4k?: boolean | null;
    description?: string | null;
    channel?: string | null;
    categoryId?: number | null;
    tagIds?: number[] | null;
  };

  const updateData: Record<string, unknown> = {};
  if (body.title != null) { updateData.title = body.title; updateData.slug = toSlug(body.title, id); }
  if (body.thumbnail != null) updateData.thumbnail = body.thumbnail;
  if (body.videoUrl != null) updateData.videoUrl = body.videoUrl;
  if ("previewUrl" in body) updateData.previewUrl = body.previewUrl;
  if (body.duration != null) updateData.duration = body.duration;
  if (body.is4k != null) updateData.is4k = body.is4k;
  if ("description" in body) updateData.description = body.description;
  if ("channel" in body) updateData.channel = body.channel;
  if ("categoryId" in body) updateData.categoryId = body.categoryId;

  const [updated] = await db
    .update(videosTable)
    .set(updateData)
    .where(eq(videosTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  if (body.tagIds !== null && body.tagIds !== undefined) {
    await upsertVideoTags(id, body.tagIds);
  }

  let categoryName: string | null = null;
  let categorySlug: string | null = null;
  if (updated.categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, updated.categoryId)).limit(1);
    if (cats.length) { categoryName = cats[0].name; categorySlug = cats[0].slug; }
  }

  const tagRows = await db
    .select({ id: tagsTable.id, name: tagsTable.name, slug: tagsTable.slug, createdAt: tagsTable.createdAt })
    .from(videoTagsTable)
    .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
    .where(eq(videoTagsTable.videoId, id));

  res.json({
    ...updated,
    categoryName,
    categorySlug,
    tags: tagRows.map(t => ({ ...t, videoCount: 0, createdAt: t.createdAt.toISOString() })),
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/admin/videos/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(videosTable).where(eq(videosTable.id, id));
  res.json({ success: true, message: "Video deleted" });
});

export default router;
