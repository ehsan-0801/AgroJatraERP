import { api } from './api';

interface SignaturePayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/** Uploads a single image file directly to Cloudinary (into the "agrajatra"
 *  folder) using a short-lived signature from our backend, and returns the
 *  secure URL. Called only when the user saves the form. */
export async function uploadImage(file: File): Promise<string> {
  const sig = await api.post<SignaturePayload>('/uploads/signature');

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? 'Image upload failed');
  return data.secure_url as string;
}
