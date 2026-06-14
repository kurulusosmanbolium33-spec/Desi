import { Header } from "./Header";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0d0f18", color: "#e8e8e8", display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <Header />
      <main style={{ flex: 1, paddingBottom: 60 }}>
        {children}
      </main>
    </div>
  );
}
