import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_HISTORY_KEY = "traversium_search_history";
const MAX_HISTORY_ITEMS = 10;

/**
 * @typedef {Object} SearchHistoryItem
 * @property {"trips" | "users"} type
 * @property {Object} item - The trip or user object
 * @property {number} timestamp
 */

/**
 * Get search history from storage
 * @returns {Promise<SearchHistoryItem[]>}
 */
export async function getSearchHistory() {
  try {
    const historyJson = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (!historyJson) return [];
    
    const history = JSON.parse(historyJson);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error("Failed to load search history:", error);
    return [];
  }
}

/**
 * Save a trip or user to history
 * @param {Object} item - The trip or user object
 * @param {"trips" | "users"} type
 * @returns {Promise<void>}
 */
export async function saveItemToHistory(item, type) {
  try {
    if (!item) return;
    
    const history = await getSearchHistory();
    
    // Remove duplicates (same item ID and type)
    const itemId = type === "trips" ? item.tripId : (item.userId || item.username);
    const filtered = history.filter(
      (historyItem) =>
        !(
          historyItem.type === type &&
          (type === "trips" 
            ? historyItem.item?.tripId === itemId
            : (historyItem.item?.userId === itemId || historyItem.item?.username === itemId))
        )
    );
    
    // Add new item at the beginning
    const newItem = {
      type,
      item,
      timestamp: Date.now(),
    };
    
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

/**
 * Clear search history
 * @returns {Promise<void>}
 */
export async function clearSearchHistory() {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}

/**
 * Get filtered search history by type
 * @param {"trips" | "users"} type
 * @returns {Promise<SearchHistoryItem[]>}
 */
export async function getSearchHistoryByType(type) {
  const history = await getSearchHistory();
  return history.filter((item) => item.type === type);
}
