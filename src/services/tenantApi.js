// Tenant Service API
import { Platform } from "react-native";

const TENANT_SERVICE_BASE = process.env.EXPO_PUBLIC_TRAVERSIUM_TENANT_SERVICE_BASE || 
  (Platform.OS === "android" ? "http://10.0.2.2:8085" : "http://localhost:8085");

/**
 * Get tenant by name
 * Returns the tenant DTO with tenant ID (Firebase tenant ID) for authentication
 */
export async function getTenantByName(name) {
  const normalizedName = name.toLowerCase().trim();
  const response = await fetch(`${TENANT_SERVICE_BASE}/rest/v1/tenants/name/${encodeURIComponent(normalizedName)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Tenant '${name}' not found`);
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to get tenant: ${response.statusText}`);
  }

  return response.json();
}

