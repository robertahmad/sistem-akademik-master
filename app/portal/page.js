
import Link from "next/link";

export default function PortalMenu() {
  return (
    <div className="portal-page-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .portal-page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-image: linear-gradient(rgba(15, 23, 42, 0.4), rgba(30, 41, 59, 0.6)), url('/image/bg-hero-portal-login-jpg.jpg');
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
          position: relative;
          padding: 6rem 2rem;
          color: white;
        }
        .portal-landing-content {
          position: relative;
          z-index: 10;
          text-align: center;
          width: 100%;
          max-width: 1000px;
        }
        .portal-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: white;
          letter-spacing: -0.02em;
        }
        .portal-subtitle {
          font-size: 1.15rem;
          color: #94a3b8;
          margin-bottom: 4rem;
        }
        .portal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 2rem;
        }
        .portal-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2.5rem 1.5rem;
          text-decoration: none;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
        }
        .portal-card:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.15);
          border-color: #FBBF24;
          box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        }
        .portal-icon {
          width: 64px;
          height: 64px;
          background: rgba(251, 191, 36, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FBBF24;
          margin-bottom: 0.5rem;
        }
        .portal-name {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        /* MOBILE RESPONSIVE PORTAL */
        @media (max-width: 768px) {
          .portal-page-container {
            padding: 3rem 1.5rem;
          }
          .portal-title {
            font-size: 2rem;
          }
          .portal-subtitle {
            font-size: 0.95rem;
            margin-bottom: 2.5rem;
          }
          .portal-card {
            padding: 1.5rem 1rem;
          }
          .portal-icon {
            width: 50px;
            height: 50px;
          }
          .portal-icon svg {
            width: 24px;
            height: 24px;
          }
          .portal-name {
            font-size: 1.1rem;
          }
        }
      `}} />
      
      <div className="portal-landing-content">
        <h1 className="portal-title">Sistem Akademik Terpadu</h1>
        <p className="portal-subtitle">Silakan pilih gerbang akses portal sesuai dengan hak akses Anda.</p>
        
        <div className="portal-grid">
          <Link href="/portal/siswa" className="portal-card">
            <div className="portal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div className="portal-name">Portal Siswa</div>
          </Link>
          
          <Link href="/portal/guru" className="portal-card">
            <div className="portal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </div>
            <div className="portal-name">Portal Guru</div>
          </Link>
          
          <Link href="/portal/admin" className="portal-card">
            <div className="portal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </div>
            <div className="portal-name">Portal Admin</div>
          </Link>
          
          <Link href="/portal/kepsek" className="portal-card">
            <div className="portal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <div className="portal-name">Portal Kepsek</div>
          </Link>

          <Link href="/portal/asesor" className="portal-card">
            <div className="portal-icon" style={{ background: "rgba(59, 130, 246, 0.2)", color: "#3B82F6" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div className="portal-name">Portal Asesor</div>
          </Link>
          <Link href="/portal/alumni/login" className="portal-card">
            <div className="portal-icon" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10B981" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <div className="portal-name">Portal Alumni</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

