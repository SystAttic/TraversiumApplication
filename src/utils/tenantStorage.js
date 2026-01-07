import * as SecureStore from "expo-secure-store";

const TENANT_ID_KEY = "traversium_tenant_id";
const TENANT_NAME_KEY = "traversium_tenant_name";
const DEFAULT_TENANT = "public"; // Official Traversium server

/**
 * Get the stored tenant ID, or return default
 */
export async function getTenantId() {
  try {
    const tenantId = await SecureStore.getItemAsync(TENANT_ID_KEY);
    return tenantId || DEFAULT_TENANT;
  } catch {
    return DEFAULT_TENANT;
  }
}

/**
 * Get the stored tenant name, or return null
 */
export async function getTenantName() {
  try {
    return await SecureStore.getItemAsync(TENANT_NAME_KEY);
  } catch {
    return null;
  }
}

/**
 * Store the tenant ID and optionally the tenant name
 */
export async function setTenantId(tenantId, tenantName = null) {
  try {
    if (tenantId && tenantId.trim()) {
      await SecureStore.setItemAsync(TENANT_ID_KEY, tenantId.trim());
      if (tenantName) {
        await SecureStore.setItemAsync(TENANT_NAME_KEY, tenantName.trim());
      } else if (tenantId === DEFAULT_TENANT) {
        // Clear tenant name for default tenant
        await SecureStore.deleteItemAsync(TENANT_NAME_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(TENANT_ID_KEY);
      await SecureStore.deleteItemAsync(TENANT_NAME_KEY);
    }
  } catch (error) {
    console.error("Failed to store tenant ID:", error);
  }
}

/**
 * Clear the stored tenant ID and name
 */
export async function clearTenantId() {
  try {
    await SecureStore.deleteItemAsync(TENANT_ID_KEY);
    await SecureStore.deleteItemAsync(TENANT_NAME_KEY);
  } catch {
    // ignore
  }
}

