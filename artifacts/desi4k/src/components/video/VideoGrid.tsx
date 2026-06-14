import { VideoCard } from "./VideoCard";
import type { FireVideo } from "@/lib/firestore";

const SKELETON = Array.from({ length: 8 });

export function VideoGrid({ videos, isLoading }: { videos?: FireVideo[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {SKELETON.map((_, i) => (
          <div key={i}>
            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8, background: "#1a1d2a", animation: "sk 1.5s ease-in-out infinite" }} />
            <div style={{ height: 16, width: "70%", marginTop: 8, borderRadius: 4, background: "#1a1d2a", animation: "sk 1.5s ease-in-out infinite" }} />
            <div style={{ height: 12, width: "40%", marginTop: 6, borderRadius: 4, background: "#1a1d2a", animation: "sk 1.5s ease-in-out infinite" }} />
          </div>
        ))}
      </div>
    );
  }
  if (!videos || videos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
        <div>No videos found</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {videos.map((v) => <VideoCard key={v.id} video={v} />)}
    </div>
  );
}
