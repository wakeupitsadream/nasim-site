// Photo preparation in the browser: decode, shrink to ~1280px, re-encode as JPEG, base64. Keeps
// uploads small (and under the route's limit) and strips EXIF, including location data, before
// anything leaves the phone. Browser-only (canvas), so it lives next to the client component.
import { DIAGNOSE_MAX_IMAGE_BYTES } from '@/lib/validation/diagnose';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

export class ImageError extends Error {
  constructor(public readonly reason: 'type' | 'size') {
    super(reason);
    this.name = 'ImageError';
  }
}

export type PreparedImage = {
  mediaType: 'image/jpeg';
  data: string;
  /** Object URL for the thumbnail; revoke it when the preview goes away. */
  previewUrl: string;
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new ImageError('type');
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageError('type');
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new ImageError('type');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) throw new ImageError('type');
  if (blob.size > DIAGNOSE_MAX_IMAGE_BYTES) throw new ImageError('size');

  return {
    mediaType: 'image/jpeg',
    data: await blobToBase64(blob),
    previewUrl: URL.createObjectURL(blob),
  };
}
