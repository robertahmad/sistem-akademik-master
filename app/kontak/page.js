"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSchoolProfilePublic } from "../actions/admin";

export default function Kontak() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [school, setSchool] = useState(null);

  useEffect(() => {
    async function loadSchool() {
      const res = await getSchoolProfilePublic();
      if (res.success) {
        setSchool(res.school);
      }
    }
    loadSchool();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Tampilkan pesan sukses pengiriman mock
    setAlert({
      show: true,
      message: `Terima kasih ${formData.name}! Pesan Anda mengenai "${formData.subject}" telah sukses terkirim. Panitia PPDB akan segera menghubungi Anda kembali via email: ${formData.email}.`,
      type: "success"
    });

    // Reset form
    setFormData({ name: "", email: "", subject: "", message: "" });
    
    // Scroll ke atas kotak alert
    const el = document.getElementById("form-alert-message");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id.replace("form-", "")]: e.target.value });
  };

  return (
    <>
      {/* PAGE HEADER */}
      <section className="page-header">
        <div className="container">
          <h1 className="page-header-title">Hubungi Kami</h1>
          <div className="page-header-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Kontak</span>
          </div>
        </div>
      </section>

      {/* KONTAK DETAIL & FORMULIR */}
      <section className="section section-white">
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Mari Berdiskusi</h2>
            <p className="section-subtitle">Punya pertanyaan seputar pendaftaran siswa baru, fasilitas, atau kurikulum? Hubungi kami langsung atau kirimkan pesan lewat formulir di bawah ini.</p>
          </div>

          <div className="contact-grid">
            {/* Informasi Kontak */}
            <div className="contact-info-panel">
              <div className="contact-card">
                <h3 style={{ fontSize: "1.3rem", color: "var(--primary-dark)", fontWeight: 700, marginBottom: "2rem" }}>
                  Hubungi Kami Langsung
                </h3>
                
                <div className="contact-details">
                  {/* Detail Alamat */}
                  <div className="contact-detail-item">
                    <div className="contact-detail-icon">📍</div>
                    <div>
                      <div className="contact-detail-label">Alamat Sekolah</div>
                      <div className="contact-detail-value">{school?.alamat || "Jl. Kota Demo-Seloboro No. 15, Kec. Kota Demo, Kab. Magelang, Jawa Tengah 56152"}</div>
                    </div>
                  </div>

                  {/* Detail Telepon */}
                  <div className="contact-detail-item">
                    <div className="contact-detail-icon">📞</div>
                    <div>
                      <div className="contact-detail-label">Telepon & WhatsApp</div>
                      <div className="contact-detail-value">{school?.telepon || "(0293) 310123 / +62 812-3456-7890"}</div>
                    </div>
                  </div>

                  {/* Detail Email */}
                  <div className="contact-detail-item">
                    <div className="contact-detail-icon">✉️</div>
                    <div>
                      <div className="contact-detail-label">Email Resmi</div>
                      <div className="contact-detail-value">{school?.email || "info@smpalqodiriyah.sch.id"}</div>
                    </div>
                  </div>
                </div>

                {/* Jam Pelayanan Informasi */}
                <div style={{ backgroundColor: "var(--bg-alt)", padding: "1.5rem", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--secondary)" }}>
                  <h4 style={{ fontWeight: 700, color: "var(--primary-dark)", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                    Informasi PPDB Offline
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Untuk pendaftaran langsung, silakan kunjungi kantor sekretariat panitia PPDB di sekolah pada jam pelayanan ({school?.jamPelayanan || "Senin - Sabtu: 07:30 - 14:00 WIB"}).
                  </p>
                </div>
              </div>
            </div>

            {/* Formulir Kontak */}
            <div className="contact-form-panel">
              <h3 style={{ fontSize: "1.3rem", color: "var(--primary-dark)", fontWeight: 700, marginBottom: "1.5rem" }}>
                Kirim Pesan Online
              </h3>
              
              {/* Alert Box */}
              {alert.show && (
                <div className={`form-alert ${alert.type}`} id="form-alert-message" style={{ display: "block", marginBottom: "1.5rem" }}>
                  {alert.message}
                </div>
              )}

              <form id="school-contact-form" onSubmit={handleSubmit}>
                <div className="form-group-row">
                  <div className="form-group">
                    <label htmlFor="form-name" className="form-label">Nama Lengkap</label>
                    <input 
                      type="text" 
                      id="form-name" 
                      className="form-input" 
                      placeholder="Masukkan nama Anda" 
                      value={formData.name}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="form-email" className="form-label">Alamat Email</label>
                    <input 
                      type="email" 
                      id="form-email" 
                      className="form-input" 
                      placeholder="contoh@email.com" 
                      value={formData.email}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label htmlFor="form-subject" className="form-label">Subjek Pesan</label>
                  <input 
                    type="text" 
                    id="form-subject" 
                    className="form-input" 
                    placeholder="Pendaftaran PPDB, Tanya Fasilitas, dll." 
                    value={formData.subject}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label htmlFor="form-message" className="form-label">Isi Pesan Anda</label>
                  <textarea 
                    id="form-message" 
                    className="form-textarea" 
                    placeholder="Tuliskan pesan atau pertanyaan Anda di sini secara detail..." 
                    value={formData.message}
                    onChange={handleChange}
                    required 
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                  Kirim Pesan Sekarang
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* PETA LOKASI */}
      <section className="section section-alt" style={{ padding: "0 0 5rem 0" }}>
        <div className="container">
          <div className="section-title-wrapper" style={{ marginBottom: "2rem" }}>
            <h2 className="section-title">Peta Lokasi Sekolah</h2>
            <p className="section-subtitle">Temukan lokasi Sekolah Master Demo dengan mudah melalui panduan peta Google Maps di bawah ini.</p>
          </div>

          <div className="map-container">
            <iframe 
              className="map-iframe"
              src={school?.googleMapsUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15835.303318536814!2d110.141527!3d-7.373461!2m3!1f0!2f0!3f0!3m2!1i1024|2i768!4f13.1!3m3!1m2!1s0x2e7a8f15ab9e088d%3A0xe5a3f120e2ef6cd3!2sKota Demo%2C%20Kec.%20Kota Demo%2C%20Kabupaten%20Magelang%2C%20Jawa%20Tengah!5e0!3m2!1sid!2sid!4v1782888000000!5m2!1sid!2sid"} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0 }}
            >
            </iframe>
          </div>
        </div>
      </section>
    </>
  );
}
