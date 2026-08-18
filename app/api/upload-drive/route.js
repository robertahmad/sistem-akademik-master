import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const credentialsStr = process.env.GOOGLE_DRIVE_CREDENTIALS;
    
    // Mock upload if no credentials (untuk keperluan testing tanpa API Key asli)
    if (!credentialsStr) {
      console.warn('GOOGLE_DRIVE_CREDENTIALS not set, using mock upload');
      return NextResponse.json({ 
        url: 'https://mock-drive-url.com/file/' + encodeURIComponent(file.name),
        downloadUrl: 'https://mock-drive-url.com/download/' + encodeURIComponent(file.name),
        id: 'mock-id-' + Date.now(),
        mock: true 
      });
    }

    let credentials;
    try {
      credentials = JSON.parse(credentialsStr);
    } catch (e) {
      console.error("Failed to parse GOOGLE_DRIVE_CREDENTIALS JSON");
      return NextResponse.json({ error: 'Invalid Google Drive Credentials' }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // Opsional

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileMetadata = {
      name: file.name,
      parents: folderId ? [folderId] : [],
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    // Make file public so teachers can view without asking access
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return NextResponse.json({ 
      url: response.data.webViewLink,
      downloadUrl: response.data.webContentLink,
      id: response.data.id
    });
  } catch (error) {
    console.error('Drive upload error:', error);
    // Return the actual error message from googleapis to help debugging
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    return NextResponse.json({ 
      error: error.message || 'Failed to upload to Google Drive',
      debugFolderId: folderId ? `Detected (${folderId.length} chars)` : 'MISSING'
    }, { status: 500 });
  }
}
