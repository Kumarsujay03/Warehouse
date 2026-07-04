const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
  folder: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

// Generate SHA-1 signature for Cloudinary API calls
async function generateSignature(params: Record<string, string>): Promise<string> {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const toSign = sorted + API_SECRET;

  // Use Web Crypto API for SHA-1
  const encoder = new TextEncoder();
  const data = encoder.encode(toSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadToCloudinary(
  file: File,
  folder: string = "Assests_warehouse"
): Promise<CloudinaryUploadResult> {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const params: Record<string, string> = { folder, timestamp };
  const signature = await generateSignature(params);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("api_key", API_KEY);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload failed");
  }

  return res.json();
}

export async function listCloudinaryResources(
  folder: string = "warehouse",
  maxResults: number = 50
): Promise<CloudinaryResource[]> {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const params: Record<string, string> = { timestamp };
  const signature = await generateSignature(params);

  const url = new URL(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`
  );

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({
      expression: `folder:${folder}`,
      max_results: maxResults,
      sort_by: [{ field: "created_at", direction: "desc" }],
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to list resources");
  }

  const data = await res.json();
  return data.resources || [];
}

export async function deleteCloudinaryResource(
  publicId: string,
  resourceType: string = "image"
): Promise<void> {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const params: Record<string, string> = {
    public_id: publicId,
    timestamp,
  };
  const signature = await generateSignature(params);

  const formData = new URLSearchParams();
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("api_key", API_KEY);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error("Failed to delete resource");
  }
}

export function getCloudinaryUrl(publicId: string, transforms?: string): string {
  const base = `https://res.cloudinary.com/${CLOUD_NAME}`;
  if (transforms) {
    return `${base}/${transforms}/${publicId}`;
  }
  return `${base}/image/upload/${publicId}`;
}
