export interface CloudinaryUploadOptions {
  folder?: string;
  tags?: string[];
}

export async function uploadToCloudinary(
  file: File,
  options?: CloudinaryUploadOptions,
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzqnzl3ir";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "mht0pfa5";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const folder = options?.folder || "my-saas/blog";
  formData.append("folder", folder);

  const tags = options?.tags || ["my-saas"];
  formData.append("tags", tags.join(","));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
