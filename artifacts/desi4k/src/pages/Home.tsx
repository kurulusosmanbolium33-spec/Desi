import { useQuery } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VideoGrid } from "@/components/video/VideoGrid";
import { fetchAllVideos, type FireVideo } from "@/lib/firestore";

export default function Home() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(searchString);
  const sort = searchParams.get("sort") || "latest";
  const q = searchParams.get("q") || "";

  const { data: allVideos = [], isLoading } = useQuery({
    queryKey: ["firebase-videos"],
    queryFn: fetchAllVideos,
    staleTime: 2 * 60 * 1000,
  });

  let videos: FireVideo[] = [...allVideos];

  if (q) {
    const ql = q.toLowerCase();
    videos = videos.filter(
      (v) =>
        (v.title || "").toLowerCase().includes(ql) ||
        (v.description || "").toLowerCase().includes(ql) ||
        (v.keywords || "").toLowerCase().includes(ql) ||
        (v.channel || "").toLowerCase().includes(ql) ||
        (v.tag || "").toLowerCase().includes(ql)
    );
  }

  if (sort === "mostviews") {
    videos.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
  } else {
    videos.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  }

  const label = q
    ? `Search: "${q}" (${videos.length})`
    : sort === "mostviews"
    ? "Most Viewed Videos"
    : "Latest Videos";

  return (
    <Shell>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "10px 10px 60px" }}>
        {q && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#888", fontSize: 13, marginBottom: 12, padding: "8px 10px", background: "#111320", borderRadius: 8 }}>
            <span>Results for <strong style={{ color: "#f5c518" }}>"{q}"</strong> ({videos.length})</span>
            <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12 }}>✕ Clear</button>
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", padding: "12px 2px 6px" }}>{label}</div>
        <VideoGrid videos={videos} isLoading={isLoading} />
      </div>
    </Shell>
  );
}
