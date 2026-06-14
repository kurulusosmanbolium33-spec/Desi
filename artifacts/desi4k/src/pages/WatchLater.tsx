import { Shell } from "@/components/layout/Shell";
import { VideoGrid } from "@/components/video/VideoGrid";
import { fetchVideoById, type FireVideo } from "@/lib/firestore";
import { useEffect, useState } from "react";

export default function WatchLater() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const stored: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wl_") && localStorage.getItem(key) === "1") {
        stored.push(key.slice(3));
      }
    }
    setIds(stored);
  }, []);

  const [videos, setVideos] = useState<FireVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    setLoading(true);
    Promise.all(ids.map((id) => fetchVideoById(id)))
      .then((results) => {
        setVideos(results.filter(Boolean) as FireVideo[]);
      })
      .finally(() => setLoading(false));
  }, [ids.join(",")]);

  const handleClear = () => {
    ids.forEach((id) => localStorage.removeItem("wl_" + id));
    setIds([]);
    setVideos([]);
  };

  return (
    <Shell>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "10px 10px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111320", borderRadius: 10, padding: "16px 14px", marginBottom: 16, borderLeft: "3px solid #f5c518" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f5c518", marginBottom: 4 }}>Watch Later</h1>
            <div style={{ fontSize: 13, color: "#666" }}>{videos.length} saved videos</div>
          </div>
          {videos.length > 0 && (
            <button onClick={handleClear}
              style={{ background: "#2a1020", color: "#dc2626", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              Clear All
            </button>
          )}
        </div>
        {!loading && videos.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔖</div>
            <div style={{ fontSize: 15 }}>No saved videos yet</div>
            <div style={{ fontSize: 13, marginTop: 6, color: "#444" }}>Tap the bookmark icon on any video to save it here</div>
          </div>
        )}
        <VideoGrid videos={videos} isLoading={loading} />
      </div>
    </Shell>
  );
        }
