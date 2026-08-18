"use client";

import { useState, useEffect } from "react";
import { getDigitalBooks, createDigitalBook, deleteBook } from "@/app/actions/library";

export default function AdminPerpustakaan() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Modul DKV");
  const [coverUrl, setCoverUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const fetchBooks = async () => {
    setLoading(true);
    const res = await getDigitalBooks();
    if (res.success) {
      setBooks(res.books);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await createDigitalBook({
      title, author, category, coverUrl, fileUrl
    });
    
    if (res.success) {
      setTitle(""); setAuthor(""); setCoverUrl(""); setFileUrl("");
      fetchBooks();
      alert("Buku digital berhasil ditambahkan!");
    } else {
      alert(res.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus e-book ini?")) return;
    const res = await deleteBook(id);
    if (res.success) fetchBooks();
    else alert(res.error);
  };

  return (
    <div style={{ animation: "fadeIn 0.3s" }}>
      <h2 style={{ marginBottom: "1rem" }}>Kelola Perpustakaan Digital</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        
        {/* Form Tambah */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0 }}>Tambah E-Book Baru</h3>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Kategori</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
                <option value="Modul DKV">Modul DKV</option>
                <option value="Buku Pelajaran (Nasional)">Buku Pelajaran (Nasional)</option>
                <option value="Novel / Fiksi">Novel / Fiksi</option>
                <option value="Agama">Agama & Akhlak</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Judul Buku</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Pengarang / Penerbit</label>
              <input type="text" required value={author} onChange={e => setAuthor(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Link Sampul (Gambar Cover)</label>
              <input type="url" required value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Link Baca PDF (Google Drive)</label>
              <input type="url" required value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            </div>
            <button type="submit" disabled={saving} style={{ width: "100%", padding: "0.75rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
              {saving ? "Menyimpan..." : "Simpan E-Book"}
            </button>
          </form>
        </div>

        {/* Daftar Buku */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0 }}>Daftar Koleksi Digital ({books.length})</h3>
          {loading ? <p>Memuat...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "600px", overflowY: "auto" }}>
              {books.length === 0 ? <p>Belum ada buku digital.</p> : books.map(book => (
                <div key={book.id} style={{ display: "flex", gap: "1rem", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px" }}>
                  <img src={book.coverUrl} alt={book.title} style={{ width: "80px", height: "110px", objectFit: "cover", borderRadius: "4px" }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: "bold", color: "#475569" }}>{book.category}</span>
                    <h4 style={{ margin: "0.5rem 0", color: "#0f172a" }}>{book.title}</h4>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#64748b" }}>{book.author}</p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <a href={book.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", background: "#dbeafe", color: "#1e40af", borderRadius: "4px", textDecoration: "none" }}>Lihat PDF</a>
                      <button onClick={() => handleDelete(book.id)} style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", border: "none", cursor: "pointer" }}>Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
