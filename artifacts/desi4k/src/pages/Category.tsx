import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VideoGrid } from "@/components/video/VideoGrid";
import { fetchVideosByCategory, fetchCategories } from "@/lib/firestore";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();

  const { data: categories = [] } = useQuery({
    queryKey: ["firebase-categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["firebase-category-videos", slug],
    queryFn: () => fetchVideosByCategory(slug!),
    enabled: !!slug,
  });

  const category = categories.find(
    (c) => c.slug === slug || c.name.toLowerCase().replace(/\s+/g, "-") === slug
  );
  const name = category?.name || (slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

  return (
    <Shell>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "10px 10px 60px" }}>
        {/* Header banner */}
        <div style={{ background: "#111320", borderRadius: 10, padding: "16px 14px", marginBottom: 16, borderLeft: "3px solid #f5c518" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f5c518", marginBottom: 4, textTransform: "capitalize" }}>{name}</h1>
          <div style={{ fontSize: 13, color: "#666" }}>{videos.length} videos</div>
        </div>

        {/* Other categories chips */}
        {categories.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4, scrollbarWidth: "none" }}>
            {categories.filter((c) => c.slug !== slug).map((cat) => (
              <a key={cat.id} href={`/category/${cat.slug}`}
                style={{ flexShrink: 0, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", border: "1px solid #1e2234", background: "#13162a", color: "#aaa", textDecoration: "none" }}>
                {cat.name}
              </a>
            ))}
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", padding: "4px 2px 8px" }}>
          {name} Videos
        </div>
        <VideoGrid videos={videos} isLoading={isLoading} />
      </div>
    </Shell>
  );
}
