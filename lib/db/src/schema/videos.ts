import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  thumbnail: text("thumbnail").notNull(),
  videoUrl: text("video_url").notNull(),
  previewUrl: text("preview_url"),
  duration: text("duration").notNull(),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  dislikes: integer("dislikes").notNull().default(0),
  is4k: boolean("is_4k").notNull().default(false),
  description: text("description"),
  channel: text("channel"),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videoTagsTable = pgTable("video_tags", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videosTable.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tagsTable.id, { onDelete: "cascade" }),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true, createdAt: true });
export const insertTagSchema = createInsertSchema(tagsTable).omit({ id: true, createdAt: true });
export const insertVideoSchema = createInsertSchema(videosTable).omit({ id: true, createdAt: true, views: true, likes: true, dislikes: true });

export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Tag = typeof tagsTable.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Video = typeof videosTable.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type VideoTag = typeof videoTagsTable.$inferSelect;
