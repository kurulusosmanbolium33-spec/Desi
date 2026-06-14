import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { fetchCategories } from "@/lib/firestore";

export default function Categories() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["firebase-categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Shell>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "10px 10px 60px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase", padding: "12px 2px 6px" }}>
          Browse All Categories
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 54, borderRadius: 10, background: "#1a1d2a", animation: "sk 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {categories.map((cat) => (
              <a key={cat.id} href={`/category/${cat.slug}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#13162a", border: "1px solid #1e2234", borderRadius: 10, padding: "14px 16px", textDecoration: "none", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1e2234", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "#f5c518", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#eee", textTransform: "capitalize" }}>{cat.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#666" }}>{cat.videoCount || 0} videos</span>
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "#555", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
