import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

const ADMIN_PASSWORD = "admin123";

interface FireDoc { id: string; [k: string]: unknown; }

async function getCollection(name: string): Promise<FireDoc[]> {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function uploadFile(file: File, path: string, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on("state_changed",
      (snap) => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject)
    );
  });
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState<boolean>(localStorage.getItem("admin_auth") === "1");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"videos" | "categories" | "tags">("videos");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_auth", "1");
      setLoggedIn(true);
      setErr("");
    } else {
      setErr("Incorrect password");
    }
  };

  if (!loggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0f18", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <img src="https://i.ibb.co.com/yBZX5GG9/Airbrush-IMAGE-ENHANCER-1781203441327-1781203441327.png" alt="Desi4KPorn"
              style={{ height: 50, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ color: "#666", fontSize: 13, marginTop: 8 }}>Admin Panel</div>
          </div>
          <div style={{ background: "#13162a", borderRadius: 14, padding: 28, border: "1px solid #1e2234" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#ddd", marginBottom: 20, textAlign: "center" }}>Login</div>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
              {err && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{err}</div>}
              <button type="submit"
                style={{ width: "100%", padding: 13, background: "#f5c518", color: "#111", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 14 }}>
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Shell>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#eee" }}>Admin Dashboard</span>
            <span style={{ background: "#1e1a00", color: "#f5c518", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "1px solid #f5c51840" }}>ADMIN</span>
          </div>
          <button onClick={() => { localStorage.removeItem("admin_auth"); setLoggedIn(false); }}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "#1e2234", color: "#999", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
            Logout
          </button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #1e2234", marginBottom: 20 }}>
          {(["videos", "categories", "tags"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "12px 18px", border: "none", background: "none", color: tab === t ? "#f5c518" : "#666", fontSize: 13, fontWeight: 600, cursor: "pointer", borderBottom: tab === t ? "2px solid #f5c518" : "2px solid transparent", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "videos" && <VideosTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "tags" && <TagsTab />}
      </div>
    </Shell>
  );
}

function VideosTab() {
  const qc = useQueryClient();
  const { data: videos = [], isLoading } = useQuery<FireDoc[]>({
    queryKey: ["admin-videos"],
    queryFn: () => getCollection("videos"),
  });
  const { data: categories = [] } = useQuery<FireDoc[]>({
    queryKey: ["admin-categories"],
    queryFn: () => getCollection("categories"),
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FireDoc | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "", channel: "", duration: "", description: "",
      keywords: "", category: "", categorySlug: "", is4k: true,
      tags: [], src: "", thumb: "", preview: "",
      views: 0, likes: 0, dislikes: 0,
    });
    setVideoFile(null); setThumbFile(null); setUploadProgress(0);
    setShowForm(true);
  };

  const openEdit = (v: FireDoc) => {
    setEditing(v);
    const { id: _id, ...rest } = v;
    setForm({ ...rest });
    setVideoFile(null); setThumbFile(null); setUploadProgress(0);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this video?")) return;
    try {
      await deleteDoc(doc(db, "videos", id));
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      qc.invalidateQueries({ queryKey: ["firebase-videos"] });
      showToast("✅ Deleted");
    } catch {
      showToast("❌ Delete failed");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let src = (form.src as string) || "";
      let thumb = (form.thumb as string) || "";

      if (videoFile) {
        setUploadProgress(1);
        src = await uploadFile(videoFile, `videos/${Date.now()}_${videoFile.name}`, setUploadProgress);
        setUploadProgress(100);
      }
      if (thumbFile) {
        thumb = await uploadFile(thumbFile, `thumbnails/${Date.now()}_${thumbFile.name}`, () => {});
      }

      const { id: _id, ...restForm } = form as { id?: unknown; [k: string]: unknown };
      const data: Record<string, unknown> = { ...restForm, src, thumb };

      if (!editing) {
        data.createdAt = Date.now();
        await addDoc(collection(db, "videos"), data);
        showToast("✅ Video added");
      } else {
        await updateDoc(doc(db, "videos", editing.id), data);
        showToast("✅ Video updated");
      }
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      qc.invalidateQueries({ queryKey: ["firebase-videos"] });
      setShowForm(false);
    } catch (err) {
      showToast("❌ Error: " + String(err));
    } finally {
      setSaving(false); setUploadProgress(0);
    }
  };

  const f = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#1e2234", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, zIndex: 999, border: "1px solid #2a2d3a" }}>
          {toast}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ color: "#888", fontSize: 13 }}>{videos.length} videos</div>
        <button onClick={openAdd} style={goldBtn}>
          <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: "currentColor", fill: "none", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Video
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#13162a", borderRadius: 14, border: "1px solid #1e2234", padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#eee" }}>{editing ? "Edit Video" : "Add Video"}</span>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: 4, fontSize: 18 }}>✕</button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gap: 12 }}>

              <div>
                <label style={labelStyle}>Title *</label>
                <input required style={inputStyle} value={(form.title as string) || ""} onChange={(e) => f("title", e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Channel</label>
                  <input style={inputStyle} value={(form.channel as string) || ""} onChange={(e) => f("channel", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Duration (e.g. 12:34)</label>
                  <input style={inputStyle} value={(form.duration as string) || ""} onChange={(e) => f("duration", e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }}
                    value={(form.category as string) || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const opt = (categories as FireDoc[]).find((c) => c.name === val);
                      f("category", val);
                      f("categorySlug", opt ? String(opt.slug || "") : val.toLowerCase().replace(/\s+/g, "-"));
                    }}>
                    <option value="">No category</option>
                    {(categories as FireDoc[]).map((c) => (
                      <option key={c.id} value={String(c.name)}>{String(c.name)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
                  <input type="checkbox" id="is4k" checked={!!(form.is4k)} onChange={(e) => f("is4k", e.target.checked)} style={{ width: 16, height: 16, accentColor: "#f5c518" }} />
                  <label htmlFor="is4k" style={{ fontSize: 13, color: "#ddd", cursor: "pointer" }}>4K Video</label>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tags (comma separated)</label>
                <input style={inputStyle} placeholder="e.g. bhabhi, outdoor, desi"
                  value={Array.isArray(form.tags) ? (form.tags as string[]).join(", ") : (form.tags as string) || ""}
                  onChange={(e) => f("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
              </div>

              <div>
                <label style={labelStyle}>Keywords (for search)</label>
                <input style={inputStyle} placeholder="e.g. hot desi bhabhi video"
                  value={(form.keywords as string) || ""} onChange={(e) => f("keywords", e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>
                  Video File
                  <span style={{ color: "#555", fontWeight: 400, marginLeft: 6 }}>(Upload to Firebase Storage)</span>
                </label>
                <input type="file" accept="video/*" style={{ ...inputStyle, padding: "8px 12px" }}
                  onChange={(e) => { setVideoFile(e.target.files?.[0] || null); }} />
                {!videoFile && (
                  <>
                    <label style={{ ...labelStyle, marginTop: 8 }}>
                      {editing ? "Current/New Video URL" : "Or paste Video URL"}
                    </label>
                    <input style={inputStyle} placeholder="https://..."
                      value={(form.src as string) || ""} onChange={(e) => f("src", e.target.value)} />
                  </>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, background: "#1e2234", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${uploadProgress}%`, background: "#f5c518", transition: "width .3s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{uploadProgress}% uploaded</div>
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Preview Video URL <span style={{ color: "#555", fontWeight: 400 }}>(hover preview, optional)</span></label>
                <input style={inputStyle} placeholder="https://... (short preview clip)"
                  value={(form.preview as string) || ""} onChange={(e) => f("preview", e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>
                  Thumbnail
                  <span style={{ color: "#555", fontWeight: 400, marginLeft: 6 }}>(Upload or paste URL)</span>
                </label>
                <input type="file" accept="image/*" style={{ ...inputStyle, padding: "8px 12px" }}
                  onChange={(e) => { setThumbFile(e.target.files?.[0] || null); }} />
                {!thumbFile && (
                  <>
                    <label style={{ ...labelStyle, marginTop: 8 }}>
                      {editing ? "Current/New Thumbnail URL" : "Or paste Thumbnail URL"}
                    </label>
                    <input style={inputStyle} placeholder="https://..."
                      value={(form.thumb as string) || ""} onChange={(e) => f("thumb", e.target.value)} />
                  </>
                )}
                {!!(form.thumb as string) && !thumbFile && (
                  <img src={form.thumb as string} alt="thumb preview"
                    style={{ marginTop: 8, height: 60, borderRadius: 6, objectFit: "cover", background: "#111" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }}
                  value={(form.description as string) || ""} onChange={(e) => f("description", e.target.value)} />
              </div>

            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="submit" disabled={saving} style={{ ...goldBtn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving
                  ? uploadProgress > 0 && uploadProgress < 100
                    ? `Uploading ${uploadProgress}%...`
                    : "Saving..."
                  : editing ? "Update Video" : "Add Video"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: "#1e2234", color: "#999", border: "none", padding: "12px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#555" }}>Loading...</div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎬</div>
          <div>No videos yet. Click "Add Video" to start.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {videos.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#13162a", border: "1px solid #1e2234", borderRadius: 10, padding: "10px 12px" }}>
              <img src={(v.thumb as string) || ""}
                alt=""
                style={{ width: 72, height: 42, objectFit: "cover", borderRadius: 5, flexShrink: 0, background: "#111" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/72x42/111/444?text=No+Thumb"; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#ddd", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{v.title as string}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 3, fontSize: 11, color: "#666", flexWrap: "wrap" }}>
                  <span>{(v.channel as string) || "No channel"}</span>
                  <span>👁 {Number(v.views) || 0}</span>
                  <span>👍 {Number(v.likes) || 0}</span>
                  {!!(v.is4k) && <span style={{ color: "#f5c518" }}>4K</span>}
                  {!!(v.category) && <span style={{ color: "#60a5fa" }}>{v.category as string}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <a href={`/video/${v.id}`} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", padding: 7, borderRadius: 7, background: "#1a2040", color: "#888", textDecoration: "none" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 2 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </a>
                <button onClick={() => openEdit(v)}
                  style={{ display: "flex", alignItems: "center", padding: 7, borderRadius: 7, background: "#1a2040", color: "#f5c518", border: "none", cursor: "pointer" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 2 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => handleDelete(v.id)}
                  style={{ display: "flex", alignItems: "center", padding: 7, borderRadius: 7, background: "#2a1020", color: "#dc2626", border: "none", cursor: "pointer" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 2 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery<FireDoc[]>({
    queryKey: ["admin-categories"],
    queryFn: () => getCollection("categories"),
  });
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
      const existing = (categories as FireDoc[]).find((c) => c.slug === slug);
      if (existing) { showToast("⚠️ Category already exists"); setSaving(false); return; }
      await addDoc(collection(db, "categories"), {
        name: name.trim(),
        slug,
        videoCount: 0,
      });
      setName("");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["firebase-categories"] });
      showToast("✅ Category added");
    } catch {
      showToast("❌ Failed to add category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete category?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["firebase-categories"] });
      showToast("✅ Deleted");
    } catch {
      showToast("❌ Delete failed");
    }
  };

  return (
    <div>
      {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#1e2234", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, zIndex: 999, border: "1px solid #2a2d3a" }}>{toast}</div>}
      <div style={{ background: "#13162a", borderRadius: 14, border: "1px solid #1e2234", padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#eee", marginBottom: 14 }}>Add Category</div>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 10 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Category name (e.g. Bhabhi)"
            value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" disabled={saving || !name.trim()} style={{ ...goldBtn, opacity: !name.trim() ? 0.5 : 1 }}>Add</button>
        </form>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 30, color: "#555" }}>Loading...</div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#555" }}>No categories yet</div>
        ) : (
          categories.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#13162a", border: "1px solid #1e2234", borderRadius: 10, padding: "12px 16px" }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#ddd" }}>{c.name as string}</span>
                <span style={{ fontSize: 12, color: "#555", marginLeft: 8 }}>/{c.slug as string}</span>
              </div>
              <button onClick={() => handleDelete(c.id)}
                style={{ display: "flex", alignItems: "center", padding: 7, borderRadius: 7, background: "#2a1020", color: "#dc2626", border: "none", cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "currentColor", fill: "none", strokeWidth: 2 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TagsTab() {
  const qc = useQueryClient();
  const { data: tags = [], isLoading } = useQuery<FireDoc[]>({
    queryKey: ["admin-tags"],
    queryFn: () => getCollection("tags"),
  });
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
      const existing = (tags as FireDoc[]).find((t) => t.slug === slug);
      if (existing) { showToast("⚠️ Tag already exists"); setSaving(false); return; }
      await addDoc(collection(db, "tags"), {
        name: name.trim(),
        slug,
        videoCount: 0,
      });
      setName("");
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      showToast("✅ Tag added");
    } catch {
      showToast("❌ Failed to add tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete tag?")) return;
    try {
      await deleteDoc(doc(db, "tags", id));
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      showToast("✅ Deleted");
    } catch {
      showToast("❌ Delete failed");
    }
  };

  return (
    <div>
      {toast && <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#1e2234", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, zIndex: 999, border: "1px solid #2a2d3a" }}>{toast}</div>}
      <div style={{ background: "#13162a", borderRadius: 14, border: "1px solid #1e2234", padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#eee", marginBottom: 14 }}>Add Tag</div>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 10 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Tag name (e.g. Outdoor)"
            value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" disabled={saving || !name.trim()} style={{ ...goldBtn, opacity: !name.trim() ? 0.5 : 1 }}>Add</button>
        </form>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 30, color: "#555", width: "100%" }}>Loading...</div>
        ) : tags.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#555", width: "100%" }}>No tags yet</div>
        ) : (
          tags.map((t) => (
            <div key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#13162a", border: "1px solid #1e2234", borderRadius: 20, padding: "6px 14px" }}>
              <span style={{ fontSize: 13, color: "#ccc" }}>{t.name as string}</span>
              <button onClick={() => handleDelete(t.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", display: "flex", padding: 0 }}>
                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: "currentColor", fill: "none", strokeWidth: 2.5 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0d0f18",
  border: "1px solid #1e2234", color: "#e8e8e8", fontSize: 13, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 0.5,
  display: "block", marginBottom: 5,
};
const goldBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  background: "#f5c518", color: "#111", border: "none", padding: "10px 18px",
  borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
};
