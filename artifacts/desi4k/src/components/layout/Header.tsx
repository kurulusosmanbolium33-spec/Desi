import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/firestore";

export function Header() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["firebase-categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setCatOpen(false);
      }
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchVal.trim();
    if (q) {
      setLocation(`/?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchVal("");
    }
  };

  return (
    <header style={{ background: "#090b14", borderBottom: "1px solid #1e2234", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 12px", height: 58, display: "flex", alignItems: "center", position: "relative" }}>
        {/* Hamburger */}
        <div ref={menuRef} style={{ position: "relative", zIndex: 60 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); if (menuOpen) setCatOpen(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", display: "flex", alignItems: "center", padding: 9, borderRadius: 8 }}
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: "currentColor", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#13162a", border: "1px solid #1e2234", borderRadius: 12, minWidth: 210, boxShadow: "0 8px 30px rgba(0,0,0,.6)", overflow: "hidden", zIndex: 100 }}>
              <div style={{ padding: "8px 16px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #1e2234" }}>Sort &amp; Filter</div>
              <button onClick={() => { setLocation("/?sort=latest"); setMenuOpen(false); }} style={ddItem}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "#f5c518", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ flex: 1 }}>Latest</span>
              </button>
              <button onClick={() => { setLocation("/?sort=mostviews"); setMenuOpen(false); }} style={ddItem}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "#f87171", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                <span style={{ flex: 1 }}>Most Views</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setCatOpen(!catOpen); }} style={ddItem}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "#60a5fa", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span style={{ flex: 1 }}>Category</span>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "#555", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", transition: "transform .2s", transform: catOpen ? "rotate(90deg)" : "none" }}><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              {catOpen && (
                <div style={{ borderTop: "1px solid #1a1d2a", maxHeight: 240, overflowY: "auto" }}>
                  {categories.map((cat) => (
                    <button key={cat.id} onClick={() => { setLocation(`/category/${cat.slug}`); setMenuOpen(false); setCatOpen(false); }}
                      style={{ display: "block", width: "100%", padding: "9px 16px 9px 44px", background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logo — centered */}
        <Link href="/" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img
            src="https://i.ibb.co.com/yBZX5GG9/Airbrush-IMAGE-ENHANCER-1781203441327-1781203441327.png"
            alt="Desi4KPorn"
            style={{ height: 42, width: "auto", objectFit: "contain", maxWidth: 180 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.removeProperty("display"); }}
          />
          <span style={{ display: "none", color: "#f5c518", fontSize: 18, fontWeight: 900 }}>
            DESI<span style={{ color: "#fff" }}>4K</span><span style={{ color: "#e11d48" }}>PORN</span>
          </span>
        </Link>

        {/* Right icons */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
          <button onClick={() => setSearchOpen(!searchOpen)} style={iconBtn} aria-label="Search">
            <svg viewBox="0 0 24 24" style={iconSvg}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <Link href="/watchlater" style={iconBtn}>
            <svg viewBox="0 0 24 24" style={iconSvg}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </Link>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 12px 10px", borderTop: "1px solid #1a1d2a" }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: "flex", alignItems: "center", background: "#1a1d2a", border: "1.5px solid #f5c518", borderRadius: 10, padding: "0 12px", gap: 8 }}>
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "#f5c518", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input ref={inputRef} type="search" placeholder="Search desi videos..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 14, outline: "none", padding: "10px 0" }} autoComplete="off" />
              {searchVal && (
                <button type="button" onClick={() => setSearchVal("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", display: "flex", padding: 2 }}>
                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: "#555", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
              <button type="submit" style={{ background: "#f5c518", color: "#111", border: "none", padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Search</button>
            </div>
          </form>
        </div>
      )}

      {/* Category chip bar */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 12px", background: "#090b14", borderBottom: "1px solid #1e2234", scrollbarWidth: "none" }}>
          <Link href="/" style={chBtnStyle(false)}>All</Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} style={chBtnStyle(false)}>{cat.name}</Link>
          ))}
        </div>
      )}
    </header>
  );
}

const ddItem: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px",
  background: "none", border: "none", color: "#ddd", fontSize: 14, cursor: "pointer", textAlign: "left",
};
const iconBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", color: "#bbb",
  display: "flex", alignItems: "center", padding: 9, borderRadius: "50%",
};
const iconSvg: React.CSSProperties = {
  width: 20, height: 20, stroke: "currentColor", fill: "none", strokeWidth: 2,
  strokeLinecap: "round", strokeLinejoin: "round",
};
const chBtnStyle = (_active: boolean): React.CSSProperties => ({
  flexShrink: 0, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
  cursor: "pointer", whiteSpace: "nowrap", border: "1px solid #1e2234",
  background: "#13162a", color: "#aaa", textDecoration: "none", display: "inline-block",
});
