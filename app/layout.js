import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

import { getSchoolProfilePublic } from "./actions/admin";

export const metadata = {
  title: "Sekolah Master Demo",
  description: "SPEKTRA – Sistem Portal Elektronik Akademik Resmi Sekolah Master Demo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SMK Al-Q",
  },
};

export const viewport = {
  themeColor: "#0f172a",
};

export default async function RootLayout({ children }) {
  const profileRes = await getSchoolProfilePublic();
  const logo = profileRes?.success && profileRes.school?.logo ? profileRes.school.logo : "/logo-generic.svg";

  return (
    <html lang="id">
      <body>
        <Header logo={logo} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
