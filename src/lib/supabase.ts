import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedAdminClient: SupabaseClient | null = null;
let cachedAnonClient: SupabaseClient | null = null;

export const DOCTOR_PHOTOS_BUCKET = 'doctor-photos';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl && 
    supabaseUrl.startsWith('http') && 
    !supabaseUrl.includes('your-project') &&
    (Boolean(supabaseServiceKey && !supabaseServiceKey.includes('your-service-role')) || 
     Boolean(supabaseAnonKey && !supabaseAnonKey.includes('your-anon-key')))
  );
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedAdminClient) return cachedAdminClient;

  const keyToUse = (supabaseServiceKey && !supabaseServiceKey.includes('your-service-role'))
    ? supabaseServiceKey
    : supabaseAnonKey;

  if (!keyToUse) return null;

  try {
    cachedAdminClient = createClient(supabaseUrl, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedAdminClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

/**
 * Upload a doctor's profile photo to Supabase Storage bucket
 */
export async function uploadDoctorPhotoToSupabase(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { url: null, error: 'Supabase is not configured' };
  }

  try {
    // 1. Ensure bucket exists or handle bucket not found gracefully
    const { error: uploadError } = await supabase.storage
      .from(DOCTOR_PHOTOS_BUCKET)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return { url: null, error: uploadError.message };
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(DOCTOR_PHOTOS_BUCKET)
      .getPublicUrl(fileName);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Unexpected error during photo upload to Supabase:', err);
    return { url: null, error: err.message || 'Storage upload failed' };
  }
}

/**
 * Delete a doctor's profile photo from Supabase Storage bucket
 */
export async function deleteDoctorPhotoFromSupabase(fileUrl: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !fileUrl) return false;

  try {
    // Extract file path from Supabase storage public URL
    // e.g. https://xyz.supabase.co/storage/v1/object/public/doctor-photos/filename.jpg
    const bucketMarker = `/${DOCTOR_PHOTOS_BUCKET}/`;
    const markerIndex = fileUrl.indexOf(bucketMarker);
    if (markerIndex === -1) return false;

    const filePath = fileUrl.substring(markerIndex + bucketMarker.length);
    if (!filePath) return false;

    const { error } = await supabase.storage
      .from(DOCTOR_PHOTOS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.warn('Failed to delete photo from Supabase Storage:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error deleting photo from Supabase:', err);
    return false;
  }
}
