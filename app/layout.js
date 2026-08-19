import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getSchoolProfilePublic } from "./actions/admin";

export async function generateMetadata() {
  const profileRes = await getSchoolProfilePublic();
  const logo = profileRes?.success && profileRes.school?.logo ? profileRes.school.logo : "/logo-generic.svg";
  
  return {
    title: "Sekolah Master Demo",
    description: "SPEKTRA - Sistem Portal Elektronik Akademik",
    manifest: "/manifest.json",
    icons: {
      icon: logo,
      apple: logo,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Master Demo",
    },
  };
}

export const viewport = {
  themeColor: "#0f172a",
};

export default async function RootLayout({ children }) {
  const profileRes = await getSchoolProfilePublic();
  const logo = profileRes?.success && profileRes.school?.logo ? profileRes.school.logo : "/logo-generic.svg";

  return (
    <html lang="id">
      <head>
        <link rel="icon" href={logo} />
        <link rel="apple-touch-icon" href={logo} />
      </head>
      <body>
        <Header logo={logo} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
