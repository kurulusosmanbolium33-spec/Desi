import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

export interface FireVideo {
  id: string;
  title: string;
  src: string;
  thumb: string;
  preview?: string;
  duration?: string;
  views?: number;
  likes?: number;
  dislikes?: number;
  channel?: string;
  tag?: string;
  description?: string;
  keywords?: string;
  is4k?: boolean;
  category?: string;
  categorySlug?: string;
  tags?: string[];
  createdAt?: number;
}

export interface FireCategory {
  id: string;
  name: string;
  slug: string;
  thumb?: string;
  videoCount?: number;
}

function toVideo(id: string, data: DocumentData): FireVideo {
  return { id, ...data } as FireVideo;
}

export async function fetchAllVideos(): Promise<FireVideo[]> {
  const snap = await getDocs(collection(db, "videos"));
  return snap.docs.map((d) => toVideo(d.id, d.data()));
}

export async function fetchVideoById(id: string): Promise<FireVideo | null> {
  const snap = await getDoc(doc(db, "videos", id));
  if (!snap.exists()) return null;
  return toVideo(snap.id, snap.data());
}

export async function fetchVideosByCategory(categorySlug: string): Promise<FireVideo[]> {
  const snap = await getDocs(collection(db, "videos"));
  return snap.docs
    .map((d) => toVideo(d.id, d.data()))
    .filter(
      (v) =>
        (v.categorySlug || "").toLowerCase() === categorySlug.toLowerCase() ||
        (v.category || "").toLowerCase() === categorySlug.toLowerCase() ||
        (v.tag || "").toLowerCase() === categorySlug.toLowerCase() ||
        (v.channel || "").toLowerCase().replace(/\s+/g, "-") === categorySlug.toLowerCase()
    );
}

export async function fetchVideosByTag(tag: string): Promise<FireVideo[]> {
  const snap = await getDocs(collection(db, "videos"));
  return snap.docs
    .map((d) => toVideo(d.id, d.data()))
    .filter((v) => (v.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase()));
}

export async function recordView(id: string): Promise<void> {
  await updateDoc(doc(db, "videos", id), { views: increment(1) });
}

export async function voteVideo(
  id: string,
  type: "liked" | "disliked",
  action: "add" | "remove",
  switchFrom?: "liked" | "disliked"
): Promise<void> {
  const updates: Record<string, unknown> = {};
  const field = type === "liked" ? "likes" : "dislikes";
  updates[field] = increment(action === "add" ? 1 : -1);
  if (switchFrom) {
    const prev = switchFrom === "liked" ? "likes" : "dislikes";
    updates[prev] = increment(-1);
  }
  await updateDoc(doc(db, "videos", id), updates);
}

export async function fetchCategories(): Promise<FireCategory[]> {
  try {
    const snap = await getDocs(collection(db, "categories"));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FireCategory));
    }
  } catch {}
  const videos = await fetchAllVideos();
  const map = new Map<string, { name: string; count: number }>();
  videos.forEach((v) => {
    const cat = v.category || v.tag || v.channel || "";
    const slug = cat.toLowerCase().replace(/\s+/g, "-");
    if (cat && !map.has(slug)) map.set(slug, { name: cat, count: 0 });
    if (cat) map.get(slug)!.count++;
  });
  return [...map.entries()].map(([slug, { name, count }]) => ({
    id: slug,
    name,
    slug,
    videoCount: count,
  }));
}
