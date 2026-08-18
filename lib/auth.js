import { cookies } from 'next/headers';

export async function setSession(user) {
  console.log("setSession called for user:", user.username, "role:", user.role);
  const cookieStore = await cookies();
  const sessionData = {
    id: user.id || 'admin',
    name: user.name || 'Administrator',
    role: user.role || 'admin', // 'admin', 'wali-kelas', 'guru-mapel', 'siswa'
    kelas: user.kelas || '',
    subjects: user.subjects || [],
    username: user.username,
    nisn: user.nisn || '',
    foto: user.foto || null
  };
  
  // Menggunakan Base64 encoding sederhana untuk token sesi server-side (httpOnly)
  const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  console.log("setting school_session cookie, token length:", token.length);
  
  cookieStore.set('school_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 Hari Sesi Aktif
    path: '/'
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('school_session')?.value;
  console.log("getSession called, found school_session token:", token ? "YES (length " + token.length + ")" : "NO");
  if (!token) return null;
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    console.log("successfully decoded session for:", decoded.username, "role:", decoded.role);
    return decoded;
  } catch (e) {
    console.error("failed to decode session token:", e);
    return null;
  }
}

export async function deleteSession() {
  console.log("deleteSession called");
  const cookieStore = await cookies();
  cookieStore.delete('school_session');
}
