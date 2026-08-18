"use client";
import { useState, useEffect } from "react";
import { getDigitalBooks } from "@/app/actions/library";

export default function DigitalLibraryViewer() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");

  useEffect(() => {
    const fetchBooks = async () => {
      const res = await getDigitalBooks();
      if (res.success) setBooks(res.books);
      setLoading(false);
    };
    fetchBooks();
  }, []);

  const categories = ["Semua", ...new Set(books.map(b => b.category))];

  const filteredBooks = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "Semua" || b.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div style={{ animation: "fadeIn 0.4s", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "var(--secondary)" }}>E-Library</span>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>Perpustakaan Digital</h2>
        </div>
        <div style={{ display: "flex", gap: "1rem", flex: 1, maxWidth: "500px" }}>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "white", outline: "none" }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ position: "relative", flex: 1 }}>
            <input 
              type="text" 
              placeholder="Cari judul buku atau penulis..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 1rem 0.5rem 2.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", outline: "none" }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>Memuat koleksi buku...</div>
      ) : filteredBooks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "var(--bg-alt)", borderRadius: "12px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-color)" }}>Buku tidak ditemukan</h3>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Coba cari dengan kata kunci lain.</p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {filteredBooks.map(book => (
            <div key={book.id} style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              overflow: "hidden", 
              boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)",
              transition: "transform 0.2s",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ position: "relative", paddingTop: "140%", backgroundColor: "#f1f5f9" }}>
                {book.coverUrl ? (
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{ 
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%", 
                  display: book.coverUrl ? "none" : "flex", 
                  alignItems: "center", justifyContent: "center", 
                  backgroundColor: "var(--primary)", color: "white", padding: "1rem", textAlign: "center",
                  fontWeight: "bold", fontSize: "1.2rem"
                }}>
                  {book.title}
                </div>
                <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "rgba(0,0,0,0.6)", color: "white", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {book.category}
                </div>
              </div>
              <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem", color: "var(--text-color)", lineHeight: "1.3" }}>
                    {book.title.length > 40 ? book.title.substring(0, 40) + "..." : book.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>{book.author}</p>
                </div>
                <a 
                  href={book.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    display: "block", 
                    marginTop: "1rem", 
                    padding: "0.5rem", 
                    textAlign: "center", 
                    background: "var(--primary)", 
                    color: "white", 
                    borderRadius: "6px", 
                    textDecoration: "none", 
                    fontSize: "0.85rem", 
                    fontWeight: "bold" 
                  }}
                >
                  📖 Baca Sekarang
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
