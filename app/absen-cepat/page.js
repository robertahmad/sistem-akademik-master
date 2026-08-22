"use client";

import { useState, useEffect, useRef } from "react";
import { scanStudentQR } from "../actions/absensi";
import { getSchoolProfilePublic } from "../actions/admin";

export default function AbsenCepatPage() {
  const [school, setSchool] = useState(null);
  const [nisnInput, setNisnInput] = useState("");
  const [status, setStatus] = useState("HADIR");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [authError, setAuthError] = useState("");
  const [scanMode, setScanMode] = useState("usb"); // "usb" or "camera"
  
  const inputRef = useRef(null);
  const clearTimerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const lastScannedRef = useRef("");
  const lastScanTimeRef = useRef(0);

  // Synthesize Sound using Web Audio API
  const playSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === "success") {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880, now + 0.1); // A5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
      } else {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  };

  // Sembunyikan Header dan Footer Utama
  useEffect(() => {
    const header = document.getElementById("main-header");
    const footer = document.getElementById("main-footer");
    if (header) header.style.display = "none";
    if (footer) footer.style.display = "none";
    return () => {
      if (header) header.style.display = "";
      if (footer) footer.style.display = "";
    };
  }, []);

  // Load School Profile
  useEffect(() => {
    async function loadProfile() {
      const res = await getSchoolProfilePublic();
      if (res.success) {
        setSchool(res.school);
      }
    }
    loadProfile();
  }, []);

  // Live Clock Tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Maintain Input Focus (Only in USB Mode)
  useEffect(() => {
    const keepFocus = () => {
      if (scanMode === "usb" && inputRef.current) {
        inputRef.current.focus();
      }
    };
    keepFocus();
    
    document.addEventListener("click", keepFocus);
    return () => document.removeEventListener("click", keepFocus);
  }, [scanMode]);

  // Keyboard shortcuts removed as status is always HADIR

  // Shared Scanning Handler (Supports both USB laser and Camera)
  const triggerScan = async (nisnVal) => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
    }

    const res = await scanStudentQR(nisnVal, status, `Pindai Cepat Terminal`);
    if (res.success) {
      setIsSuccess(true);
      setScannedStudent({
        name: res.studentName,
        className: res.className,
        foto: res.foto,
        nisn: nisnVal,
        status: status
      });
      setMessage(`Berhasil Absen! ${res.studentName} tercatat ${status}.`);
      playSound("success");
      setAuthError("");
    } else {
      setIsSuccess(false);
      setScannedStudent(null);
      if (res.error === "Unauthorized") {
        setAuthError("Sesi Belum Aktif / Habis. Harap login kembali sebagai Admin atau Guru terlebih dahulu.");
      } else {
        setMessage(res.error || "Gagal mencatat absensi.");
      }
      playSound("error");
    }

    // Auto-clear success display after 3.5 seconds
    clearTimerRef.current = setTimeout(() => {
      setMessage("");
      setScannedStudent(null);
    }, 3500);

    // Auto-reset status back to HADIR for the next student
    setStatus("HADIR");
  };

  // Handle USB scanner input form submission
  const handleUsbSubmit = async (e) => {
    e.preventDefault();
    if (!inputRef.current) return;
    const currentNisn = inputRef.current.value.trim();
    if (!currentNisn) return;
    
    inputRef.current.value = ""; // clear instantly without waiting for state
    setNisnInput(""); // keep state sync just in case
    
    await triggerScan(currentNisn);
  };

  // Initialize and tear down HTML5 Camera QR Code Scanner dynamically (CSR only)
  useEffect(() => {
    if (scanMode === "camera") {
      import("html5-qrcode").then((module) => {
        const { Html5QrcodeScanner } = module;
        
        if (html5QrcodeScannerRef.current) {
          try {
            html5QrcodeScannerRef.current.clear();
          } catch (err) {
            console.error("Error clearing scanner on re-init:", err);
          }
        }
        
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 15, 
            qrbox: (width, height) => {
              const minDim = Math.min(width, height);
              const qrboxSize = Math.floor(minDim * 0.65);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0
          },
          /* verbose= */ false
        );
        
        scanner.render(
          async (decodedText) => {
            // Anti-shake cooldown: skip if same code within 4 seconds
            if (lastScannedRef.current === decodedText && Date.now() - lastScanTimeRef.current < 4000) {
              return;
            }
            lastScannedRef.current = decodedText;
            lastScanTimeRef.current = Date.now();
            await triggerScan(decodedText);
          },
          (error) => {
            // Silence debugging scanner warnings
          }
        );
        
        html5QrcodeScannerRef.current = scanner;
      }).catch(err => {
        console.error("Failed to load html5-qrcode dynamically:", err);
      });
    } else {
      if (html5QrcodeScannerRef.current) {
        try {
          html5QrcodeScannerRef.current.clear();
          html5QrcodeScannerRef.current = null;
        } catch (e) {
          console.error("Error clearing scanner on mode switch:", e);
        }
      }
    }

    return () => {
      if (html5QrcodeScannerRef.current) {
        try {
          html5QrcodeScannerRef.current.clear();
          html5QrcodeScannerRef.current = null;
        } catch (e) {
          console.error("Error clearing scanner on unmount:", e);
        }
      }
    };
  }, [scanMode, status]); // Rebind scanner when status changes to capture updated status value inside closure!

  const logoSrc = (school?.logo && school.logo !== "🏫" && school.logo !== "") ? school.logo : "/logo-generic.svg";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0b0f19",
      color: "#f8fafc",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "2rem",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Background Decorative Glows */}
      <div style={{
        position: "absolute",
        top: "-10%",
        right: "-10%",
        width: "40vw",
        height: "40vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "-10%",
        left: "-10%",
        width: "40vw",
        height: "40vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* HEADER SECTION */}
      <header style={{
        width: "100%",
        maxWidth: "900px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        paddingBottom: "1.25rem",
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {school ? (
            logoSrc !== "dY?" ? (
              <img src={logoSrc} alt="Logo" style={{ height: "50px", width: "50px", objectFit: "contain" }} />
            ) : (
              <div style={{ fontSize: "2.5rem" }}>{logoSrc}</div>
            )
          ) : (
            <div style={{ width: "50px", height: "50px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "50%" }} />
          )}
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, tracking: "0.5px", textTransform: "uppercase", color: "#10b981" }}>
              {school?.nama || "SEKOLAH MASTER DEMO"}
            </h1>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Terminal Absensi Scan QR Code Harian</p>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "1px", color: "#3b82f6", margin: 0 }}>{currentTime}</div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>{currentDate}</div>
        </div>
      </header>

      {/* MAIN BODY AREA */}
      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: "600px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        margin: "2rem 0"
      }}>
        {authError ? (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "2px solid #ef4444",
            borderRadius: "16px",
            padding: "2rem",
            textAlign: "center",
            width: "100%",
            boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.2)"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#ef4444", margin: "0 0 0.5rem 0" }}>Otorisasi Dibatasi</h2>
            <p style={{ fontSize: "0.9rem", color: "#cbd5e1", lineHeight: "1.5", margin: "0 0 1.5rem 0" }}>{authError}</p>
            <a 
              href="/portal/guru" 
              style={{
                display: "inline-block",
                backgroundColor: "#ef4444",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                fontSize: "0.9rem",
                transition: "all 0.2s"
              }}
            >
              Kembali ke Login Guru
            </a>
          </div>
        ) : (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            
            {/* SCAN MODE CONTROLLER */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
              width: "100%"
            }}>
              <button
                type="button"
                onClick={() => setScanMode("usb")}
                style={{
                  flex: 1,
                  padding: "0.6rem 1rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: scanMode === "usb" ? "#3b82f6" : "rgba(255,255,255,0.02)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M18 12V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v8" />
                  <path d="M6 12a6 6 0 0 0 12 0" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="9" y1="2" x2="9" y2="4" />
                  <line x1="15" y1="2" x2="15" y2="4" />
                </svg>
                Scanner USB (HC-P10)
              </button>
              <button
                type="button"
                onClick={() => setScanMode("camera")}
                style={{
                  flex: 1,
                  padding: "0.6rem 1rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: scanMode === "camera" ? "#10b981" : "rgba(255,255,255,0.02)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Kamera HP / Device
              </button>
            </div>

            {/* STATUS TOGGLE CONTROLLER REMOVED - ALWAYS HADIR */}

            {/* SCREEN FEEDBACK DISPLAY CARD */}
            <div style={{
              width: "100%",
              minHeight: "280px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)"
            }}>
              {scannedStudent ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                }}>
                  <div style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    border: `4px solid ${scannedStudent.status === "HADIR" ? "#22c55e" : scannedStudent.status === "SAKIT" ? "#3b82f6" : scannedStudent.status === "IZIN" ? "#eab308" : "#ef4444"}`,
                    overflow: "hidden",
                    marginBottom: "1rem",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
                  }}>
                    {scannedStudent.foto ? (
                      <img src={scannedStudent.foto} alt={scannedStudent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                        👤
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "white", margin: "0 0 0.25rem 0", textAlign: "center" }}>
                    {scannedStudent.name}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "#10b981", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>
                    Kelas: {scannedStudent.className}
                  </p>
                  <div style={{
                    backgroundColor: scannedStudent.status === "HADIR" ? "#22c55e" : scannedStudent.status === "SAKIT" ? "#3b82f6" : scannedStudent.status === "IZIN" ? "#eab308" : "#ef4444",
                    color: "white",
                    padding: "0.25rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    textTransform: "uppercase"
                  }}>
                    {scannedStudent.status}
                  </div>
                </div>
              ) : message ? (
                <div style={{
                  textAlign: "center",
                  animation: "fadeIn 0.2s",
                  padding: "1rem"
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚠️</div>
                  <p style={{ fontSize: "1rem", fontWeight: "bold", color: "#ef4444", margin: 0 }}>
                    {message}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem" }}>
                    Silakan scan ulang kartu siswa.
                  </p>
                </div>
              ) : scanMode === "camera" ? (
                /* CAMERA VIEWFINDER SECTION */
                <div style={{
                  width: "100%",
                  maxWidth: "320px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}>
                  <div id="qr-reader" style={{ width: "100%", borderRadius: "14px", overflow: "hidden", backgroundColor: "#090d16" }} />
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.75rem", textAlign: "center" }}>
                    Arahkan kamera HP Anda tepat ke QR Code siswa.
                  </p>
                </div>
              ) : (
                /* USB STANDBY VIEW */
                <div style={{
                  textAlign: "center",
                  color: "#475569",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}>
                  <div style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.01)",
                    border: "2px dashed #334155",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    marginBottom: "1rem",
                    animation: "spin 8s linear infinite"
                  }}>
                    🔌
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0, fontWeight: 500 }}>
                    Menunggu Pindaian Kartu USB Scanner...
                  </p>
                  <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "0.25rem" }}>
                    Mode: <strong style={{ color: "#22c55e" }}>OTOMATIS HADIR</strong>
                  </p>
                </div>
              )}
            </div>

            {/* USB SCANNER HIDDEN FORM */}
            {scanMode === "usb" && (
              <form onSubmit={handleUsbSubmit} style={{ width: "100%", marginTop: "1rem" }}>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-input"
                  placeholder="Arahkan kursor & scan QR di sini..."
                  defaultValue=""
                  autoComplete="off"
                  style={{
                    width: "100%",
                    textAlign: "center",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.05)",
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                    padding: "0.6rem",
                    borderRadius: "8px",
                    outline: "none"
                  }}
                />
              </form>
            )}

          </div>
        )}
      </main>

      {/* FOOTER METADATA */}
      <footer style={{
        width: "100%",
        maxWidth: "900px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        paddingTop: "1.25rem",
        fontSize: "0.72rem",
        color: "#475569",
        zIndex: 10
      }}>
        <div>PresenAl-Q PWA v2.3 | Mode Terminal Cepat</div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <span>Pastikan kursor berada di kotak input saat memindai</span>
        </div>
      </footer>

      {/* Custom styles for Html5QrcodeScanner and Animations */}
      <style jsx global>{`
        /* Overrides untuk tampilan Html5QrcodeScanner */
        #qr-reader {
          border: none !important;
        }
        #qr-reader__dashboard {
          padding: 8px !important;
          background-color: rgba(255,255,255,0.01) !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        }
        #qr-reader__scan_region {
          border: none !important;
        }
        #qr-reader button {
          background-color: #10b981 !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: bold !important;
          font-size: 0.8rem !important;
          cursor: pointer !important;
          margin: 6px !important;
          transition: all 0.2s !important;
        }
        #qr-reader button:hover {
          background-color: #059669 !important;
        }
        #qr-reader select {
          background-color: #1e293b !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          padding: 6px !important;
          border-radius: 6px !important;
          font-size: 0.8rem !important;
          margin: 6px !important;
          outline: none !important;
        }
        #qr-reader__status_span {
          font-size: 0.75rem !important;
          color: #94a3b8 !important;
        }
        #qr-reader__camera_selection {
          max-width: 100% !important;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
