import React, { useState, useEffect } from "react";
import { ImageBackground, View, ActivityIndicator } from "react-native";
import { auth } from "../services/firebase";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import { FILE_STORAGE_SERVICE_BASE } from "../services/traversiumApi";

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
 * AuthenticatedImageBackground component that loads images with Bearer token authentication
 * This is needed because React Native's ImageBackground component doesn't support custom headers.
 * It downloads the image with auth, caches it locally, and displays the cached version.
 */
export default function AuthenticatedImageBackground({ 
  source, 
  style, 
  imageStyle,
  children,
  onLoad,
  onError,
  ...props 
}) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      if (!source?.uri) {
        setLoading(false);
        return;
      }

      // Check if it's a file storage service URL
      const isFileStorageUrl = source.uri.includes(FILE_STORAGE_SERVICE_BASE);
      
      if (!isFileStorageUrl) {
        // For non-file-storage URLs, use directly (no auth needed)
        setImageUri(source.uri);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get auth token
        const token = await getIdToken();
        if (!token) {
          throw new Error("No authentication token available");
        }

        // Create cache filename from URL
        const urlParts = source.uri.split("/");
        const filename = urlParts[urlParts.length - 1];
        const cacheUri = `${FileSystem.cacheDirectory}authenticated_${filename}`;

        // Check if file is already cached
        const fileInfo = await FileSystem.getInfoAsync(cacheUri);
        if (fileInfo.exists && !cancelled) {
          // Use cached version
          setImageUri(cacheUri);
          setLoading(false);
          if (onLoad) {
            onLoad();
          }
          return;
        }

        // Download image with authentication
        const downloadResult = await FileSystem.downloadAsync(
          source.uri,
          cacheUri,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (cancelled) return;

        if (downloadResult.status !== 200) {
          throw new Error(`Download failed with status ${downloadResult.status}`);
        }

        setImageUri(downloadResult.uri);
        setLoading(false);
        if (onLoad) {
          onLoad();
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[AuthenticatedImageBackground] Failed to load image:", {
          uri: source.uri,
          error: err.message || err,
        });
        setError(err);
        setLoading(false);
        if (onError) {
          onError({ nativeEvent: { error: err } });
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [source?.uri]);

  if (loading) {
    return (
      <View style={[style, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="small" />
        {children}
      </View>
    );
  }

  if (error || !imageUri) {
    return (
      <View style={style}>
        {children}
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: imageUri }}
      style={style}
      imageStyle={imageStyle}
      onLoad={onLoad}
      onError={onError}
      {...props}
    >
      {children}
    </ImageBackground>
  );
}

