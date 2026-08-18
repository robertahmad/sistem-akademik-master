"use client";

import React, { useState, useEffect } from "react";
import { getSchoolProfile, updateKepsekSignature, updateTteSettings, updateGuruSignature } from "../../actions/settings";

export default function SettingsTab({ session }) {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingTte, setSavingTte] = useState(false);
  const [tteForm, setTteForm] = useState({ enabled: false, provider: "BSrE", id: "" });

  const fetchProfile = async () => {
    setLoading(true);
    const res = await getSchoolProfile();
    if (res.success) {
      setSchool(res.school);
      setTteForm({
        enabled: res.school.tteEnabled || false,
        provider: res.school.tteProvider || "BSrE",
        id: res.school.tteId || ""
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUploadSignature = async (e, isGuru) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("signature", file);

    const res = isGuru ? await updateGuruSignature(formData) : await updateKepsekSignature(formData);
    if (res.success) {
      alert("Tanda tangan berhasil diperbarui! Silakan refresh halaman.");
      fetchProfile();
    } else {
      alert("Gagal mengunggah: " + res.error);
    }
    setUploading(false);
  };

  const handleSaveTte = async (e) => {
    e.preventDefault();
    setSavingTte(true);
    const res = await updateTteSettings({
      tteEnabled: tteForm.enabled,
      tteProvider: tteForm.provider,
      tteId: tteForm.id
    });
    if (res.success) {
      alert("Pengaturan Tanda Tangan Elektronik Resmi berhasil disimpan!");
      fetchProfile();
    } else {
      alert("Gagal menyimpan: " + res.error);
    }
    setSavingTte(false);
  };

  if (loading) return <p style={{ padding: "1rem" }}>Memuat pengaturan...</p>;
  if (!school) return <p style={{ padding: "1rem" }}>Gagal memuat profil sekolah.</p>;

  const isKepsekOrAdmin = session?.role === "admin" || session?.role === "kepsek";
  const isGuruPortal = session?.role === "wali-kelas" || session?.role === "guru-mapel";

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b", marginBottom: "1.5rem" }}>Pengaturan Tanda Tangan</h2>

      <div style={{ background: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", maxWidth: "600px" }}>
        
        {isKepsekOrAdmin && (
          <>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Pengesahan Dokumen (Kepala Sekolah)</h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Tanda tangan ini akan digunakan untuk merender secara otomatis dokumen resmi sekolah seperti E-Sertifikat PKL, SKL, dan Rapor.
            </p>
            
            <div style={{ marginBottom: "1rem" }}>
           <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#334155", marginBottom: "0.5rem" }}>Kepala Sekolah Saat Ini</label>
           <input type="text" value={school.kepsek} disabled style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f1f5f9" }} />
           <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>NIP. {school.kepsekNip}</p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
           <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#334155", marginBottom: "0.5rem" }}>Tanda Tangan Digital (Transparan / PNG)</label>
           {school.kepsekSignature ? (
             <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc", textAlign: "center" }}>
               <img src={school.kepsekSignature} alt="Tanda Tangan Kepsek" style={{ maxHeight: "100px", objectFit: "contain" }} />
             </div>
           ) : (
             <div style={{ marginBottom: "1rem", padding: "1.5rem", border: "1px dashed #ef4444", borderRadius: "8px", background: "#fef2f2", textAlign: "center", color: "#dc2626", fontSize: "0.9rem" }}>
               Belum ada tanda tangan yang diunggah. Sertifikat tidak dapat dicetak secara valid.
             </div>
           )}
           
           <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <label style={{ cursor: "pointer", background: "#2563eb", color: "white", padding: "0.75rem 1.5rem", borderRadius: "6px", fontWeight: "bold", display: "inline-block" }}>
                 {uploading ? "Mengunggah..." : (school.kepsekSignature ? "Ganti Tanda Tangan Kepsek" : "Unggah Tanda Tangan")}
                 <input type="file" accept="image/png, image/jpeg" style={{ display: "none" }} onChange={(e) => handleUploadSignature(e, false)} disabled={uploading} />
              </label>
           </div>
        </div>
        </>
        )}

        {isGuruPortal && (
          <div style={{ marginTop: "1rem" }}>
             <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Tanda Tangan Pribadi (Wali Kelas / Guru)</h3>
             <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1.5rem" }}>
               Tanda tangan ini akan digunakan pada dokumen seperti Rapor Siswa dan laporan yang mewajibkan pengesahan Anda sebagai Guru.
             </p>
             <div style={{ marginBottom: "1.5rem" }}>
                {session.signature ? (
                  <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc", textAlign: "center" }}>
                    <img src={session.signature} alt="Tanda Tangan Pribadi" style={{ maxHeight: "100px", objectFit: "contain" }} />
                  </div>
                ) : (
                  <div style={{ marginBottom: "1rem", padding: "1.5rem", border: "1px dashed #ef4444", borderRadius: "8px", background: "#fef2f2", textAlign: "center", color: "#dc2626", fontSize: "0.9rem" }}>
                    Belum ada tanda tangan pribadi yang diunggah.
                  </div>
                )}
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                   <label style={{ cursor: "pointer", background: "#10b981", color: "white", padding: "0.75rem 1.5rem", borderRadius: "6px", fontWeight: "bold", display: "inline-block" }}>
                      {uploading ? "Mengunggah..." : (session.signature ? "Ganti Tanda Tangan Pribadi" : "Unggah Tanda Tangan Pribadi")}
                      <input type="file" accept="image/png, image/jpeg" style={{ display: "none" }} onChange={(e) => handleUploadSignature(e, true)} disabled={uploading} />
                   </label>
                </div>
             </div>
           </div>
        )}

        {isKepsekOrAdmin && (
          <>
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "2rem 0" }} />

            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Tanda Tangan Pihak Eksternal</h3>
            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#334155" }}>Pimpinan Industri (DUDI)</h4>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#64748b" }}>Tanda tangan Pimpinan Industri diunggah secara individual pada masing-masing data perusahaan.</p>
                <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#2563eb" }}>Akses: Manajemen PKL → Tab "Data DUDI"</div>
              </div>
              <div style={{ padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#334155" }}>Asesor Penguji (UKK)</h4>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#64748b" }}>Tanda tangan Asesor dapat diunggah mandiri oleh Asesor via Portal Asesor, atau dikelola oleh Admin.</p>
                <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#2563eb" }}>Akses: Manajemen UKK → Tab "Asesor Penguji"</div>
              </div>
            </div>
            
            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "2rem 0" }} />

            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Opsi Lanjutan: Tanda Tangan Elektronik Tersertifikasi</h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Aktifkan fitur ini jika Kepala Sekolah telah mendaftar mandiri ke Penyelenggara Sertifikasi Elektronik Resmi (seperti BSrE BSSN atau PrivyID). E-Sertifikat akan dibubuhi metadata kriptografi/QR TTE Resmi.
            </p>

        <form onSubmit={handleSaveTte} style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", cursor: "pointer", fontWeight: "bold", color: "#334155" }}>
            <input type="checkbox" checked={tteForm.enabled} onChange={e => setTteForm({...tteForm, enabled: e.target.checked})} style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }} />
            Gunakan Tanda Tangan Elektronik (TTE) Resmi
          </label>

          {tteForm.enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#334155", marginBottom: "0.5rem" }}>Penyedia Layanan Sertifikat</label>
                <select value={tteForm.provider} onChange={e => setTteForm({...tteForm, provider: e.target.value})} style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                  <option value="BSrE">BSrE (BSSN) - Pemerintah</option>
                  <option value="Privy">PrivyID - Swasta</option>
                  <option value="Peruri">Peruri Sign</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#334155", marginBottom: "0.5rem" }}>ID Pengguna / NIK / Token</label>
                <input type="text" value={tteForm.id} onChange={e => setTteForm({...tteForm, id: e.target.value})} placeholder="Misal: 3308xxxxxxxxxxxx atau Passphrase Sertifikat" style={{ width: "100%", padding: "0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>Data ini akan diintegrasikan dengan API penerbit saat E-Sertifikat di-*generate*.</p>
              </div>
            </div>
          )}

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button type="submit" disabled={savingTte} style={{ background: tteForm.enabled ? "#10b981" : "#64748b", color: "white", padding: "0.75rem 1.5rem", borderRadius: "6px", fontWeight: "bold", border: "none", cursor: savingTte ? "not-allowed" : "pointer" }}>
                {savingTte ? "Menyimpan..." : "Simpan Pengaturan TTE"}
              </button>
            </div>
          </form>
          </>
        )}

      </div>
    </div>
  );
}
