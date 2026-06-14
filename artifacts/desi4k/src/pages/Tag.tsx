import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VideoGrid } from "@/components/video/VideoGrid";
import { fetchVideosByTag } from "@/lib/firestore";

export default function Tag() {
  const { slug } = useParams<{ slug: string }>();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["firebase-tag-videos", slug],
    queryFn: () => fetchVideosByTag(slug!),
    enabled: !!slug,
  });

  const name = slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  return (
    <Shell>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "10px 10px 60px" }}>
        <div style={{ background: "#111320", borderRadius: 10, padding: "16px 14px", marginBottom: 16, borderLeft: "3px solid #60a5fa" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#60a5fa", marginBottom: 4 }}>#{name}</h1>
          <div style={{ fontSize: 13, color: "#666" }}>{videos.length} videos</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", padding: "4px 2px 8px" }}>
          Tagged: {name}
        </div>
        <VideoGrid videos={videos} isLoading={isLoading} />
      </div>
    </Shell>
  );
}
