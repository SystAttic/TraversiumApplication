// FileStorageService API client
import { FILE_STORAGE_SERVICE_BASE } from "./traversiumApi";
import { auth } from "./firebase";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "traversium_token";

/**
 * Get Firebase ID token for authentication
 */
async function getIdToken() {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to get ID token:", error);
    return null;
  }
}

/**
 * Upload a media file to Azure Blob Storage
 * @param {Object} file - File object (from expo-image-picker or similar)
 * @param {string} file.uri - Local file URI
 * @param {string} file.type - MIME type (e.g., "image/jpeg", "video/mp4")
 * @param {string} file.name - Original filename (optional)
 * @returns {Promise<FileDataDto>} FileDataDto with file metadata including filename, fileType, fileFormat, size, dimensions, geoLocation, etc.
 */
export async function uploadMediaFile(file) {
  if (!file || !file.uri) {
    throw new Error("File is required");
  }

  const formData = new FormData();
  
  // Extract filename from URI if name not provided
  const filename = file.name || file.uri.split("/").pop() || "file";
  
  // Append file to FormData
  // For React Native, we need to specify the type and name
  formData.append("file", {
    uri: file.uri,
    type: file.type || "image/jpeg",
    name: filename,
  });

  const token = await getIdToken();
  const headers = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type header - let fetch set it with boundary for multipart/form-data
  const response = await fetch(`${FILE_STORAGE_SERVICE_BASE}/rest/v1/media`, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.body = data;
    throw err;
  }

  return data;
}

/**
 * Get a media file by its unique filename
 * @param {string} filename - Unique filename returned from upload
 * @returns {Promise<Response>} Fetch Response object with blob data
 */
export async function downloadMediaFile(filename) {
  if (!filename) {
    throw new Error("Filename is required");
  }

  const token = await getIdToken();
  const headers = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${FILE_STORAGE_SERVICE_BASE}/rest/v1/media/${encodeURIComponent(filename)}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.body = data;
    throw err;
  }

  return response;
}

/**
 * Get media file URL (for use in Image/Video components)
 * This constructs the URL that can be used directly in React Native Image components
 * @param {string} filename - Unique filename returned from upload
 * @returns {string} Full URL to the media file
 */
export function getMediaFileUrl(filename) {
  if (!filename) {
    return null;
  }
  return `${FILE_STORAGE_SERVICE_BASE}/rest/v1/media/${encodeURIComponent(filename)}`;
}

/**
 * Delete a media file by its unique filename
 * @param {string} filename - Unique filename to delete
 * @returns {Promise<void>}
 */
export async function deleteMediaFile(filename) {
  if (!filename) {
    throw new Error("Filename is required");
  }

  const token = await getIdToken();
  const headers = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${FILE_STORAGE_SERVICE_BASE}/rest/v1/media/${encodeURIComponent(filename)}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.body = data;
    throw err;
  }

  // 204 No Content - successful deletion
  return;
}

