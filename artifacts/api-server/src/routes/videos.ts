import { Router } from "express";
import { db } from "@workspace/db";
import { videosTable, categoriesTable, tagsTable, videoTagsTable } from "@workspace/db";
import { eq, sql, desc, asc, ilike, and, inArray } from "drizzle-orm";

const router = Router();

async function getVideoWithTags(id: number) {
  const rows = await db
    .select({
      id: videosTable.id,
      title: videosTable.title,
      slug: videosTable.slug,
      thumbnail: videosTable.thumbnail,
      videoUrl: videosTable.videoUrl,
      previewUrl: videosTable.previewUrl,
      duration: videosTable.duration,
      views: videosTable.views,
      likes: videosTable.likes,
      dislikes: videosTable.dislikes,
      is4k: videosTable.is4k,
      description: videosTable.description,
      channel: videosTable.channel,
      categoryId: videosTable.categoryId,
      categoryName: categoriesTable.name,
      categorySlug: categoriesTable.slug,
      createdAt: videosTable.createdAt,
    })
    .from(videosTable)
    .leftJoin(categoriesTable, eq(videosTable.categoryId, categoriesTable.id))
    .where(eq(videosTable.id, id))
    .limit(1);

  if (!rows.length) return null;
  const v = rows[0];

  const tagRows = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      createdAt: tagsTable.createdAt,
      videoCount: sql<number>`cast(count(${videoTagsTable.videoId}) as int)`,
    })
    .from(videoTagsTable)
    .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
    .where(eq(videoTagsTable.videoId, id))
    .groupBy(tagsTable.id);

  return {
    ...v,
    tags: tagRows.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
    createdAt: v.createdAt.toISOString(),
  };
}

async function getTagsForVideo(videoId: number) {
  const tagRows = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      createdAt: tagsTable.createdAt,
    })
    .from(videoTagsTable)
    .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
    .where(eq(videoTagsTable.videoId, videoId));
  return tagRows.map(t => ({ ...t, videoCount: 0, createdAt: t.createdAt.toISOString() }));
}

router.get("/videos", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
  const sort = String(req.query.sort ?? "latest");
  const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : null;
  const tagId = req.query.tagId ? parseInt(String(req.query.tagId), 10) : null;
  const q = req.query.q ? String(req.query.q) : null;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (categoryId) conditions.push(eq(videosTable.categoryId, categoryId));
  if (q) conditions.push(ilike(videosTable.title, `%${q}%`));

  let videoIds: number[] | null = null;
  if (tagId) {
    const tagged = await db
      .select({ videoId: videoTagsTable.videoId })
      .from(videoTagsTable)
      .where(eq(videoTagsTable.tagId, tagId));
    videoIds = tagged.map(t => t.videoId);
    if (!videoIds.length) {
      res.json({ videos: [], total: 0, page, limit, totalPages: 0 });
      return;
    }
    conditions.push(inArray(videosTable.id, videoIds));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orderBy = sort === "mostviews"
    ? desc(videosTable.views)
    : sort === "oldest"
    ? asc(videosTable.createdAt)
    : desc(videosTable.createdAt);

  const [countRow] = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(videosTable)
    .where(whereClause);

  const total = countRow?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const rows = await db
    .select({
      id: videosTable.id,
      title: videosTable.title,
      slug: videosTable.slug,
      thumbnail: videosTable.thumbnail,
      videoUrl: videosTable.videoUrl,
      previewUrl: videosTable.previewUrl,
      duration: videosTable.duration,
      views: videosTable.views,
      likes: videosTable.likes,
      dislikes: videosTable.dislikes,
      is4k: videosTable.is4k,
      description: videosTable.description,
      channel: videosTable.channel,
      categoryId: videosTable.categoryId,
      categoryName: categoriesTable.name,
      categorySlug: categoriesTable.slug,
      createdAt: videosTable.createdAt,
    })
    .from(videosTable)
    .leftJoin(categoriesTable, eq(videosTable.categoryId, categoriesTable.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const videoIdsInPage = rows.map(v => v.id);
  let tagsMap: Record<number, { id: number; name: string; slug: string; videoCount: number; createdAt: string }[]> = {};
  if (videoIdsInPage.length) {
    const allTags = await db
      .select({
        videoId: videoTagsTable.videoId,
        id: tagsTable.id,
        name: tagsTable.name,
        slug: tagsTable.slug,
        createdAt: tagsTable.createdAt,
      })
      .from(videoTagsTable)
      .innerJoin(tagsTable, eq(videoTagsTable.tagId, tagsTable.id))
      .where(inArray(videoTagsTable.videoId, videoIdsInPage));
    for (const t of allTags) {
      if (!tagsMap[t.videoId]) tagsMap[t.videoId] = [];
      tagsMap[t.videoId].push({ id: t.id, name: t.name, slug: t.slug, videoCount: 0, createdAt: t.createdAt.toISOString() });
    }
  }

  const videos = rows.map(v => ({
    ...v,
    tags: tagsMap[v.id] ?? [],
    createdAt: v.createdAt.toISOString(),
  }));

  res.json({ videos, total, page, limit, totalPages });
});

router.get("/videos/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const video = await getVideoWithTags(id);
  if (!video) { res.status(404).json({ error: "Not found" }); return; }
  res.json(video);
});

router.post("/videos/:id/view", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db
    .update(videosTable)
    .set({ views: sql`${videosTable.views} + 1` })
    .where(eq(videosTable.id, id))
    .returning({ views: videosTable.views });
  res.json({ views: updated?.views ?? 0 });
});

router.post("/videos/:id/vote", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { type } = req.body as { type: "like" | "dislike" };
  if (type !== "like" && type !== "dislike") {
    res.status(400).json({ error: "Invalid vote type" });
    return;
  }
  const update = type === "like"
    ? { likes: sql`${videosTable.likes} + 1` }
    : { dislikes: sql`${videosTable.dislikes} + 1` };
  const [updated] = await db
    .update(videosTable)
    .set(update)
    .where(eq(videosTable.id, id))
    .returning({ likes: videosTable.likes, dislikes: videosTable.dislikes });
  res.json({ likes: updated?.likes ?? 0, dislikes: updated?.dislikes ?? 0 });
});

router.get("/stats", async (req, res) => {
  const [videoStats] = await db
    .select({
      totalVideos: sql<number>`cast(count(*) as int)`,
      totalViews: sql<number>`cast(coalesce(sum(${videosTable.views}), 0) as int)`,
    })
    .from(videosTable);
  const [catCount] = await db
    .select({ totalCategories: sql<number>`cast(count(*) as int)` })
    .from(categoriesTable);
  const [tagCount] = await db
    .select({ totalTags: sql<number>`cast(count(*) as int)` })
    .from(tagsTable);

  res.json({
    totalVideos: videoStats?.totalVideos ?? 0,
    totalCategories: catCount?.totalCategories ?? 0,
    totalTags: tagCount?.totalTags ?? 0,
    totalViews: videoStats?.totalViews ?? 0,
  });
});

export default router;
