const fs = require('fs');
const p = 'C:/Users/USER/.gemini/antigravity/scratch/sistem-akademik-master/app/actions/admin.js';
let c = fs.readFileSync(p, 'utf8');

const newFunctions = `
export async function updateSchoolPublicContent(data) {
  try {
    const { getSession } = require('./auth');
    const prisma = require('../../lib/prisma').default;
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'kepsek')) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.school.update({
      where: { id: 1 },
      data: {
        profilImage: data.profilImage !== undefined ? data.profilImage : undefined,
        akademikImage: data.akademikImage !== undefined ? data.akademikImage : undefined,
        galeriImages: data.galeriImages !== undefined ? data.galeriImages : undefined,
        heroTitle: data.heroTitle !== undefined ? data.heroTitle : undefined,
        heroSubtitle: data.heroSubtitle !== undefined ? data.heroSubtitle : undefined,
        sejarahTitle: data.sejarahTitle !== undefined ? data.sejarahTitle : undefined,
        sejarahText: data.sejarahText !== undefined ? data.sejarahText : undefined,
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating public content:', error);
    return { success: false, error: error.message || 'Gagal menyimpan konten publik' };
  }
}

export async function uploadPublicPhoto(formData) {
  try {
    const { getSession } = require('./auth');
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'kepsek')) {
      return { success: false, error: 'Unauthorized' };
    }
    const file = formData.get('file');
    if (!file) return { success: false, error: 'Tidak ada file' };

    const { put } = require('@vercel/blob');
    const blob = await put(\`public/\${Date.now()}-\${file.name}\`, file, {
      access: 'public',
    });
    return { success: true, photoUrl: blob.url };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Gagal mengunggah foto ke Blob' };
  }
}
`;

if (!c.includes('updateSchoolPublicContent')) {
  fs.writeFileSync(p, c + newFunctions);
  console.log('Added public content actions');
} else {
  console.log('Actions already exist');
}
