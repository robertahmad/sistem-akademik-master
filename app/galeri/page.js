"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSchoolProfilePublic } from "../actions/admin";

export default function Galeri() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [items, setItems] = useState([
    {
      id: 1,
      category: "belajar",
      image: "/hero_school.jpg",
      title: "Gedung dan Taman Sekolah",
      categoryName: "Kegiatan Belajar",
    },
    {
      id: 2,
      category: "belajar",
      image: "/facility_computer.jpg",
      title: "Praktikum Mandiri Lab TIK",
      categoryName: "Kegiatan Belajar",
    },
    {
      id: 3,
      category: "lomba",
      image: "/extracurricular_scout.jpg",
      title: "Kemah Bakti Pramuka",
      categoryName: "Prestasi & Lomba",
    },
    {
      id: 4,
      category: "lomba",
      image: "/news_silat.jpg",
      title: "Penyerahan Piala Juara Silat",
      categoryName: "Prestasi & Lomba",
    },
    {
      id: 5,
      category: "agama",
      image: "/news_ramadhan.jpg",
      title: "Tadarus Bersama di Masjid",
      categoryName: "Keagamaan",
    },
    {
      id: 6,
      category: "agama",
      image: "/principal.jpeg",
      title: "Kajian Keislaman Rutin Guru",
      categoryName: "Keagamaan",
    },
  ]);

  useEffect(() => {
    async function loadSchool() {
      const res = await getSchoolProfilePublic();
      if (res.success && res.school?.galeriImages) {
        const urls = res.school.galeriImages.split(";").filter(Boolean);
        const mappedItems = urls.map((url, index) => {
          let category = "belajar";
          let categoryName = "Kegiatan Belajar";
          if (url.includes("scout") || url.includes("silat") || url.includes("lomba") || url.includes("prestasi")) {
            category = "lomba";
            categoryName = "Prestasi & Lomba";
          } else if (url.includes("ramadhan") || url.includes("agama") || url.includes("masjid") || url.includes("principal") || url.includes("ustadz")) {
            category = "agama";
            categoryName = "Keagamaan";
          }
          
          let title = "Dokumentasi Kegiatan Sekolah Master Demo";
          if (url.includes("computer") || url.includes("lab")) title = "Praktikum Mandiri di Lab Komputer TIK";
          else if (url.includes("scout") || url.includes("pramuka")) title = "Kegiatan Kemah Bakti Pramuka Siswa";
          else if (url.includes("silat") || url.includes("beladiri")) title = "Latihan & Penyerahan Medali Juara Pencak Silat";
          else if (url.includes("ramadhan") || url.includes("tadarus")) title = "Tadarus & Pondok Ramadhan di Masjid";
          else if (url.includes("school") || url.includes("gedung")) title = "Gedung Utama & Halaman Hijau Sekolah";
          else if (url.includes("principal") || url.includes("headmaster") || url.includes("guru")) title = "Pembinaan Karakter & Rapat Dewan Guru";

          return {
            id: index + 1,
            category,
            image: url,
            title,
            categoryName
          };
        });
        setItems(mappedItems);
      }
    }
    loadSchool();
  }, []);

  const filteredItems = activeFilter === "all" 
    ? items 
    : items.filter(item => item.category === activeFilter);

  return (
    <>
      {/* PAGE HEADER */}
      <section className="page-header">
        <div className="container">
          <h1 className="page-header-title">Galeri Sekolah</h1>
          <div className="page-header-breadcrumbs">
            <Link href="/">Beranda</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Galeri</span>
          </div>
        </div>
      </section>

      {/* GALERI FOTO FILTER */}
      <section className="section section-white">
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Dokumentasi Kegiatan</h2>
            <p className="section-subtitle">Potret momen-momen berharga dari berbagai aktivitas akademik, keagamaan, serta pencapaian prestasi siswa.</p>
          </div>

          {/* Tombol Filter */}
          <div className="gallery-filter">
            <button 
              className={`filter-btn ${activeFilter === "all" ? "active" : ""}`} 
              onClick={() => setActiveFilter("all")}
            >
              Semua Foto
            </button>
            <button 
              className={`filter-btn ${activeFilter === "belajar" ? "active" : ""}`} 
              onClick={() => setActiveFilter("belajar")}
            >
              Kegiatan Belajar
            </button>
            <button 
              className={`filter-btn ${activeFilter === "agama" ? "active" : ""}`} 
              onClick={() => setActiveFilter("agama")}
            >
              Keagamaan
            </button>
            <button 
              className={`filter-btn ${activeFilter === "lomba" ? "active" : ""}`} 
              onClick={() => setActiveFilter("lomba")}
            >
              Prestasi & Lomba
            </button>
          </div>

          {/* Grid Foto */}
          <div className="gallery-grid">
            {filteredItems.map(item => (
              <div className={`gallery-item ${item.category}`} key={item.id}>
                <div className="gallery-item-image-wrapper">
                  <img src={item.image} alt={item.title} className="gallery-item-image" />
                </div>
                <div className="gallery-item-info">
                  <h3 className="gallery-item-title">{item.title}</h3>
                  <span className="gallery-item-category">{item.categoryName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
