import { apiClient } from "./api";

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const data = await apiClient.postForm<{ url: string }>("/upload/", fd);
    return data.url;
  } catch (error: any) {
    throw new Error(error?.data?.detail || "Upload failed");
  }
}
