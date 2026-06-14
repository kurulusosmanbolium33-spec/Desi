import { Link } from "wouter";
import type { FireVideo } from "@/lib/firestore";

const fmtNum = (v?: number) => {
  const n = Number(v || 0);
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

export function VideoCard({ video }: { video: FireVideo }) {
  const channel = (video.channel || video.tag || "").trim();

  return (
    <Link href={`/video/${video.id}`} style={{ cursor: "pointer", display: "block", textDecoration: "none" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", background: "#111" }}>
        <img
          src={video.thumb || ""}
          alt={video.title || ""}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/640x360/13162a/444?text=Video"; }}
        />
        {!!video.is4k && (
          <div style={{
            position: "absolute", top: 6, right: 6, background: "#f5c518", color: "#111",
            fontSize: 10, fontWeight: 900, padding: "3px 7px", borderRadius: 4, letterSpacing: 1,
            animation: "pulse4k 1.8s ease-in-out infinite", zIndex: 2
          }}>4K</div>
        )}
        {video.duration && (
          <div style={{
            position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,.85)",
            color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 5, zIndex: 2
          }}>{video.duration}</div>
        )}
      </div>
      <div style={{ padding: "8px 2px 2px" }}>
        <div style={{
          fontSize: 14, fontWeight: 500, color: "#e8e8e8", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 6
        }}>{video.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#13162a", color: "#999", fontSize: 11, padding: "3px 10px", borderRadius: 12, border: "1px solid #1e2234" }}>
            <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, stroke: "#666", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>
            </svg>
            {channel || "Channel"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#555", fontSize: 11 }}>
            <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, stroke: "#555", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {fmtNum(video.views)}
          </div>
        </div>
      </div>
    </Link>
  );
}
