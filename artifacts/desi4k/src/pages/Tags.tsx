import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { fetchAllVideos } from "@/lib/firestore";

export default function Tags() {
  const { data: allVideos = [], isLoading } = useQuery({
    queryKey: ["firebase-videos"],
    queryFn: fetchAllVideos,
    staleTime: 2 * 60 * 1000,
  });

  const tagMap = new Map<string, number>();
  allVideos.forEach((v) => {
    (v.tags || []).forEach((tag) => {
      const slug = tag.toLowerCase().replace(/\s+/g, "-");
      tagMap.set(slug, (tagMap.get(slug) || 0) + 1);
    });
  });
  const tags = [...tagMap.entries()].map(([slug, count]) => ({
    slug,
    name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    count,
  })).sort((a, b) => b.count - a.count);

  return (
    <Shell>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "10px 10px 60px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", padding: "12px 2px 6px" }}>
          Browse All Tags
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ height: 32, width: 80, borderRadius: 20, background: "#1a1d2a", animation: "sk 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏷️</div>
            <div>No tags found</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((tag) => (
              <a key={tag.slug} href={`/tag/${tag.slug}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#13162a", border: "1px solid #1e2234", borderRadius: 20, padding: "6px 14px", textDecoration: "none", cursor: "pointer", fontSize: 13, color: "#ccc" }}>
                <span style={{ color: "#555" }}>#</span>{tag.name}
                <span style={{ fontSize: 11, color: "#555", marginLeft: 2 }}>({tag.count})</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
