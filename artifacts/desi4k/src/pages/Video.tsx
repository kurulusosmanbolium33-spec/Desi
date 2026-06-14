import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VideoGrid } from "@/components/video/VideoGrid";
import { fetchVideoById, fetchAllVideos, recordView, voteVideo } from "@/lib/firestore";
import { useEffect, useRef, useState } from "react";

const fmtNum = (v?: number) => {
  const n = Number(v || 0);
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
};

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const hasViewed = useRef(false);

  const { data: video, isLoading } = useQuery({
    queryKey: ["firebase-video", id],
    queryFn: () => fetchVideoById(id!),
    enabled: !!id,
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ["firebase-videos"],
    queryFn: fetchAllVideos,
    staleTime: 2 * 60 * 1000,
  });

  const related = allVideos.filter((v) => v.id !== id).slice(0, 20);

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [currentVote, setCurrentVote] = useState<"liked" | "disliked" | null>(null);
  const [voting, setVoting] = useState(false);
  const [toast, setToast] = useState("");
  const [wlSaved, setWlSaved] = useState(false);
  const [descExp, setDescExp] = useState(false);

  useEffect(() => {
    if (video) {
      setLikes(Number(video.likes) || 0);
      setDislikes(Number(video.dislikes) || 0);
      setCurrentVote((localStorage.getItem("vote_" + video.id) as "liked" | "disliked" | null) || null);
      setWlSaved(localStorage.getItem("wl_" + video.id) === "1");
    }
  }, [video]);

  useEffect(() => {
    if (video && !hasViewed.current) {
      hasViewed.current = true;
      recordView(video.id).catch(() => {});
    }
  }, [video]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const handleVote = async (type: "liked" | "disliked") => {
    if (voting || !video) return;
    setVoting(true);
    try {
      const prev = currentVote;
      if (prev === type) {
        await voteVideo(video.id, type, "remove");
        setCurrentVote(null);
        localStorage.removeItem("vote_" + video.id);
        if (type === "liked") setLikes((l) => Math.max(0, l - 1));
        else setDislikes((d) => Math.max(0, d - 1));
        showToast(type === "liked" ? "👍 Like removed" : "👎 Dislike removed");
      } else {
        await voteVideo(video.id, type, "add", prev || undefined);
        setCurrentVote(type);
        localStorage.setItem("vote_" + video.id, type);
        if (prev === "liked") setLikes((l) => Math.max(0, l - 1));
        if (prev === "disliked") setDislikes((d) => Math.max(0, d - 1));
        if (type === "liked") setLikes((l) => l + 1);
        else setDislikes((d) => d + 1);
        showToast(type === "liked" ? "👍 Liked!" : "👎 Disliked");
      }
    } catch {
      showToast("⚠️ Failed. Try again.");
    } finally {
      setVoting(false);
    }
  };

  const toggleWatchLater = () => {
    if (!video) return;
    if (wlSaved) {
      localStorage.removeItem("wl_" + video.id);
      setWlSaved(false);
      showToast("🔖 Removed");
    } else {
      localStorage.setItem("wl_" + video.id, "1");
      setWlSaved(true);
      showToast("🔖 Saved to Watch Later");
    }
  };

  const channel = video ? (video.channel || video.tag || "").trim() : "";

  if (isLoading) {
    return (
      <Shell>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 10 }}>
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#1a1d2a", borderRadius: 8, animation: "sk 1.5s ease-in-out infinite" }} />
          <div style={{ height: 18, width: "70%", marginTop: 10, borderRadius: 4, background: "#1a1d2a", animation: "sk 1.5s ease-in-out infinite" }} />
          <div style={{ height: 14, width: "45%", marginTop: 8, borderRadius: 4, background: "#1a1d2a", animation: "sk 1.5s ease-in-out infinite" }} />
        </div>
      </Shell>
    );
  }

  if (!video) {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
          <div style={{ fontSize: 44 }}>⚠️</div>
          <div style={{ marginTop: 10 }}>Video not found</div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#1e2234", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, zIndex: 200, border: "1px solid #2a2d3a", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
      <div style={{ position: "sticky", top: 58, zIndex: 30, background: "#000" }}>
        <video
          key={video.id}
          src={video.src || ""}
          poster={video.thumb || ""}
          controls
          playsInline
          style={{ width: "100%", aspectRatio: "16/9", display: "block", background: "#000" }}
        />
      </div>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ padding: "12px 12px 8px" }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: "#eee", lineHeight: 1.4, marginBottom: 12 }}>{video.title}</h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => handleVote("liked")} disabled={voting}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: currentVote === "liked" ? "#2563eb" : "#1e2234", color: currentVote === "liked" ? "#fff" : "#999", opacity: voting ? 0.6 : 1 }}>
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: "currentColor", fill: currentVote === "liked" ? "#fff" : "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                {fmtNum(likes)}
              </button>
              <button onClick={() => handleVote("disliked")} disabled={voting}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: currentVote === "disliked" ? "#dc2626" : "#1e2234", color: currentVote === "disliked" ? "#fff" : "#999", opacity: voting ? 0.6 : 1 }}>
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: "currentColor", fill: currentVote === "disliked" ? "#fff" : "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                  <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
                {fmtNum(dislikes)}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#666", fontSize: 13, marginLeft: 4 }}>
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: "#666", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {fmtNum(video.views)}
              </div>
            </div>
            <button onClick={toggleWatchLater} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 4, color: wlSaved ? "#f5c518" : "#777" }}>
              <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, stroke: "currentColor", fill: wlSaved ? "#f5c518" : "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              Watch Later
            </button>
          </div>
          <div style={{ background: "#111320", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Channel</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#1a1d2a", color: "#ccc", fontSize: 13, padding: "5px 14px", borderRadius: 20, border: "1px solid #2a2d3a" }}>
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "#777", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>
              </svg>
              {channel || "Channel"}
            </div>
          </div>
          {(video.category || (video.tags && video.tags.length > 0)) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {video.category && (
                <a href={`/category/${video.categorySlug || video.category?.toLowerCase().replace(/\s+/g, "-")}`}
                  style={{ background: "#1e2234", color: "#f5c518", fontSize: 12, padding: "4px 12px", borderRadius: 20, textDecoration: "none", border: "1px solid #f5c51840" }}>
                  {video.category}
                </a>
              )}
              {(video.tags || []).map((tag) => (
                <a key={tag} href={`/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}
                  style={{ background: "#13162a", color: "#aaa", fontSize: 12, padding: "4px 12px", borderRadius: 20, textDecoration: "none", border: "1px solid #1e2234" }}>
                  {tag}
                </a>
              ))}
            </div>
          )}
          {video.description && (
            <div style={{ background: "#111320", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</div>
              <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6, whiteSpace: "pre-wrap", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: descExp ? "unset" : 3 }}>{video.description}</div>
              {video.description.length > 120 && (
                <button onClick={() => setDescExp(!descExp)} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, background: "none", border: "none", cursor: "pointer", color: "#f5c518", fontSize: 12, padding: 0 }}>
                  {descExp ? "Show less" : "Show more"}
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "#f5c518", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", transform: descExp ? "rotate(180deg)" : "none" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        {related.length > 0 && (
          <div style={{ padding: "0 12px 40px" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#ddd", marginBottom: 12 }}>Recommended</div>
            <VideoGrid videos={related} />
          </div>
        )}
      </div>
    </Shell>
  );
    }
