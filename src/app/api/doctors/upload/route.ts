import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getSessionUser } from '@/lib/auth';
import { isHospitalAdminOrAbove } from '@/types';
import { 
  isSupabaseConfigured, 
  uploadDoctorPhotoToSupabase, 
  deleteDoctorPhotoFromSupabase 
} from '@/lib/supabase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser();
    if (!session || !isHospitalAdminOrAbove(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Hospital Admin or Super Admin access required.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const previousPhotoUrl = (formData.get('previousPhotoUrl') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file format. Allowed formats: JPG, PNG, WebP.' 
      }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size exceeds limit (maximum 4 MB).' 
      }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `doc-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${fileExt}`;

    let photoUrl = '';

    // 1. Try Supabase Storage if configured
    if (isSupabaseConfigured()) {
      const { url, error } = await uploadDoctorPhotoToSupabase(fileBuffer, fileName, file.type);
      if (url) {
        photoUrl = url;
        // Clean up previous photo if stored in Supabase
        if (previousPhotoUrl && previousPhotoUrl.includes('supabase.co')) {
          deleteDoctorPhotoFromSupabase(previousPhotoUrl);
        }
      } else {
        console.warn('Supabase storage upload failed, falling back to local storage:', error);
      }
    }

    // 2. Fallback to local storage (offline dev) or Base64 Data URL (Vercel read-only filesystem)
    if (!photoUrl) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'doctors');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const localPath = path.join(uploadDir, fileName);
        fs.writeFileSync(localPath, fileBuffer);
        photoUrl = `/uploads/doctors/${fileName}`;

        // Clean up previous local file if applicable
        if (previousPhotoUrl && previousPhotoUrl.startsWith('/uploads/doctors/')) {
          try {
            const oldLocalPath = path.join(process.cwd(), 'public', previousPhotoUrl);
            if (fs.existsSync(oldLocalPath)) {
              fs.unlinkSync(oldLocalPath);
            }
          } catch (cleanErr) {
            console.warn('Failed to clean up old local photo:', cleanErr);
          }
        }
      } catch (fsErr) {
        // Read-only filesystem (e.g. Vercel serverless /var/task)
        // Store as base64 Data URL so it works seamlessly without write permissions
        console.warn('Local filesystem is read-only. Falling back to Data URL for doctor photo.');
        const mimeType = file.type || 'image/jpeg';
        photoUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      }
    }

    return NextResponse.json({
      success: true,
      url: photoUrl,
      message: 'Doctor photo uploaded successfully.'
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process photo upload.' }, { status: 500 });
  }
}
