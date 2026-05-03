// Storage helper — upload/delete product images
import { supabase } from './supabase';

const BUCKET = 'product_images';

// Upload image file → returns public URL
export async function uploadProductImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file);
  if (error) { console.error('Upload error:', error); return null; }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

// Delete image by URL
export async function deleteProductImage(url: string): Promise<void> {
  // Extract filename from URL
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  if (fileName) {
    await supabase.storage.from(BUCKET).remove([fileName]);
  }
}
