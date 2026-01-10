import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, FlatList, Dimensions, TouchableWithoutFeedback, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getTripById } from "../../../../../../src/services/tripApi";
import { getMediaFileUrl } from "../../../../../../src/services/fileStorageApi";
import { auth } from "../../../../../../src/services/firebase";
import { getLikeCount, getComments, likeMedia, unlikeMedia, createComment } from "../../../../../../src/services/socialApi";
import { getUserById } from "../../../../../../src/services/userApi";
import TText from "../../../../../../src/components/TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../../../../../src/theme/spacing";
import AuthenticatedImage from "../../../../../../src/components/AuthenticatedImage";
import BottomSheet from "../../../../../../src/components/BottomSheet";
import CommentsSection from "../../../../../../src/components/comments/CommentsSection";

const UI_HIDE_AFTER = 2500;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MediaViewer() {
  const { id, momentId, mediaId } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [trip, setTrip] = useState(null);
  const [index, setIndex] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [mediaOwner, setMediaOwner] = useState(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const timer = useRef(null);
  const flatListRef = useRef(null);
  const indexRef = useRef(0);
  const isScrollingProgrammatically = useRef(false);
  const mediaLengthRef = useRef(0);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const tripIdNum = Number(Array.isArray(id) ? id[0] : id);
        if (!tripIdNum || isNaN(tripIdNum)) {
          console.error("Invalid trip ID:", id);
          return;
        }
        
        const tripData = await getTripById(tripIdNum);
        if (!on) return;
        
        // Transform API response to UI format (same as index.jsx)
        const currentUserId = auth.currentUser?.uid || null;
        const isCollaborator = tripData.collaborators?.includes(currentUserId) || false;
        const isOwner = tripData.ownerId === currentUserId;
        
        // Flatten media from all albums
        const allMedia = [];
        const moments = [];
        
        tripData.albums?.forEach((album) => {
          // Skip default album for moments list
          if (album.albumId === tripData.defaultAlbum) {
            // Add media from default album to allMedia
            album.media?.forEach((m) => {
              if (!m.pathUrl) return; // Skip media without pathUrl
              allMedia.push({
                id: String(m.mediaId),
                uri: getMediaFileUrl(m.pathUrl),
                uploader: m.uploader,
                createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
              });
            });
          } else {
            // Create moment from album
            const albumMedia = album.media || [];
            const coverMedia = albumMedia[0];
            moments.push({
              id: String(album.albumId),
              title: album.title || "Untitled Moment",
              description: album.description || "",
              coverUri: coverMedia ? getMediaFileUrl(coverMedia.pathUrl) : null,
              mediaIds: albumMedia.map((m) => String(m.mediaId)),
              createdBy: coverMedia?.uploader || tripData.ownerId,
              createdAt: album.createdAt ? new Date(album.createdAt).getTime() : Date.now(),
            });
            
            // Add media from this album
            albumMedia.forEach((m) => {
              if (!m.pathUrl) return; // Skip media without pathUrl
              allMedia.push({
                id: String(m.mediaId),
                uri: getMediaFileUrl(m.pathUrl),
                uploader: m.uploader,
                createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
              });
            });
          }
        });
        
        // Transform collaborators (for now just IDs, will need user API later)
        const collaborators = tripData.collaborators?.map((firebaseId) => ({
          id: firebaseId,
          username: firebaseId, // Placeholder
          displayName: firebaseId, // Placeholder
        })) || [];
        
        const transformedTrip = {
          id: String(tripData.tripId),
          tripId: tripData.tripId,
          title: tripData.title || "",
          description: tripData.description || "",
          coverUri: tripData.coverPhotoUrl ? getMediaFileUrl(tripData.coverPhotoUrl) : null,
          visibility: tripData.visibility || "PRIVATE",
          ownerId: tripData.ownerId,
          currentUserId,
          isCollaborator: isCollaborator || isOwner,
          isViewer: !isCollaborator && !isOwner,
          collaborators,
          media: allMedia,
          moments,
          stats: {
            moments: moments.length,
            media: allMedia.length,
          },
        };
        
        setTrip(transformedTrip);
      } catch (error) {
        console.error("Failed to load trip:", error);
      }
    })();
    return () => { on = false; };
  }, [id]);

  const moment = useMemo(() => (trip?.moments || []).find(m => m.id === String(momentId)), [trip, momentId]);

  const media = useMemo(() => {
    if (!trip || !moment) return [];
    const byId = Object.fromEntries((trip.media || []).map(m => [m.id, m]));
    return (moment.mediaIds || []).map(mid => byId[mid]).filter(Boolean);
  }, [trip, moment]);

  // Update media length ref
  useEffect(() => {
    mediaLengthRef.current = media.length;
  }, [media.length]);

  // Calculate initial index
  const initialIndex = useMemo(() => {
    if (!media.length) return 0;
    const idx = media.findIndex(m => m.id === String(mediaId));
    return idx >= 0 ? idx : 0;
  }, [media, mediaId]);

  // Set initial index on mount
  useEffect(() => {
    if (initialIndex !== index) {
      setIndex(initialIndex);
      indexRef.current = initialIndex;
    }
  }, [initialIndex]);

  const current = media[index];

  // Load likes and comments for current media
  useEffect(() => {
    if (!current?.id) {
      setLikeCount(0);
      setCommentCount(0);
      return;
    }

    let on = true;
    const mediaIdNum = Number(current.id);
    if (!mediaIdNum || isNaN(mediaIdNum)) {
      setLikeCount(0);
      setCommentCount(0);
      return;
    }

    (async () => {
      try {
        // Load like count
        try {
          const likeData = await getLikeCount(mediaIdNum);
          if (!on) return;
          setLikeCount(likeData?.likeCount || 0);
          setIsLiked(likeData?.isLiked || false);
        } catch (error) {
          // Handle errors gracefully - treat as 0 likes
          // Backend should return empty results, but handle 404 as fallback
          if (on) {
            setLikeCount(0);
            setIsLiked(false);
          }
        }

        // Load comment count
        try {
          const commentsData = await getComments(mediaIdNum, 0, 1);
          if (!on) return;
          setCommentCount(commentsData?.totalElements || 0);
        } catch (error) {
          // Handle errors gracefully - treat as 0 comments
          // Backend should return empty page, but handle 404 as fallback
          if (on) setCommentCount(0);
        }
      } catch (error) {
        // Fallback error handling
        if (on) {
          setLikeCount(0);
          setCommentCount(0);
        }
      }
    })();

    return () => { on = false; };
  }, [current?.id]);

  // Load media owner information
  useEffect(() => {
    if (!current?.uploader) {
      setMediaOwner(null);
      return;
    }

    let on = true;
    setLoadingOwner(true);

    (async () => {
      try {
        const owner = await getUserById(current.uploader);
        if (!on) return;
        setMediaOwner(owner);
      } catch (error) {
        console.error("Failed to fetch media owner:", error);
        if (on) setMediaOwner(null);
      } finally {
        if (on) setLoadingOwner(false);
      }
    })();

    return () => { on = false; };
  }, [current?.uploader]);

  const scheduleHide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShowUI(false), UI_HIDE_AFTER);
  };

  // auto-hide after open
  useEffect(() => {
    setShowUI(true);
    scheduleHide();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [index]);

  const toggleUI = () => {
    const next = !showUI;
    setShowUI(next);
    if (next) scheduleHide();
  };

  const prev = () => { 
    if (index > 0) {
      isScrollingProgrammatically.current = true;
      const newIndex = index - 1;
      setIndex(newIndex);
      indexRef.current = newIndex;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 300);
    }
  };
  
  const nextM = () => { 
    if (index < media.length - 1) {
      isScrollingProgrammatically.current = true;
      const newIndex = index + 1;
      setIndex(newIndex);
      indexRef.current = newIndex;
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 300);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    // Ignore updates during programmatic scrolling
    if (isScrollingProgrammatically.current) return;
    
    if (viewableItems.length > 0 && viewableItems[0].index !== null && viewableItems[0].index !== undefined) {
      const newIndex = viewableItems[0].index;
      // Only update if it's actually different to avoid unnecessary re-renders
      if (newIndex !== indexRef.current && newIndex >= 0 && newIndex < mediaLengthRef.current) {
        indexRef.current = newIndex;
        setIndex(newIndex);
      }
    }
  }).current;

  // Update indexRef when index changes
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 0,
  }).current;

  // Fallback: Update index on scroll end
  const onMomentumScrollEnd = useRef((event) => {
    if (isScrollingProgrammatically.current) return;
    
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    
    if (newIndex !== indexRef.current && newIndex >= 0 && newIndex < mediaLengthRef.current) {
      indexRef.current = newIndex;
      setIndex(newIndex);
    }
  }).current;

  // Handle like/unlike
  const handleLikeToggle = async () => {
    if (!current?.id) return;
    const mediaIdNum = Number(current.id);
    if (!mediaIdNum || isNaN(mediaIdNum)) return;

    const wasLiked = isLiked;
    // Optimistic update
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (wasLiked) {
        await unlikeMedia(mediaIdNum);
      } else {
        await likeMedia(mediaIdNum);
      }
      // Refresh like count to get accurate data
      const likeData = await getLikeCount(mediaIdNum);
      setLikeCount(likeData?.likeCount || 0);
      setIsLiked(likeData?.isLiked || false);
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      Alert.alert("Error", "Failed to update like. Please try again.");
    }
  };

  // Load comments when sheet opens
  useEffect(() => {
    if (!showCommentsSheet || !current?.id) return;
    
    const mediaIdNum = Number(current.id);
    if (!mediaIdNum || isNaN(mediaIdNum)) return;

    let on = true;
    setLoadingComments(true);

    (async () => {
      try {
        const commentsData = await getComments(mediaIdNum, 0, 50);
        if (!on) return;
        setComments(commentsData?.content || []);
      } catch (error) {
        console.error("Failed to load comments:", error);
        if (on) setComments([]);
      } finally {
        if (on) setLoadingComments(false);
      }
    })();

    return () => { on = false; };
  }, [showCommentsSheet, current?.id]);

  // Post new comment
  const handlePostComment = async () => {
    if (!newCommentText.trim() || !current?.id) return;
    const mediaIdNum = Number(current.id);
    if (!mediaIdNum || isNaN(mediaIdNum)) return;

    setPostingComment(true);
    try {
      await createComment(mediaIdNum, { content: newCommentText.trim() });
      setNewCommentText("");
      // Reload comments
      const commentsData = await getComments(mediaIdNum, 0, 50);
      setComments(commentsData?.content || []);
      setCommentCount(commentsData?.totalElements || 0);
    } catch (error) {
      console.error("Failed to post comment:", error);
      Alert.alert("Error", "Failed to post comment. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };

  // Post reply
  const handlePostReply = async (parentCommentId) => {
    if (!replyText.trim() || !current?.id) return;
    const mediaIdNum = Number(current.id);
    if (!mediaIdNum || isNaN(mediaIdNum)) return;

    setPostingComment(true);
    try {
      await createComment(mediaIdNum, { content: replyText.trim(), parentId: parentCommentId });
      setReplyText("");
      setReplyingTo(null);
      // Reload comments
      const commentsData = await getComments(mediaIdNum, 0, 50);
      setComments(commentsData?.content || []);
      setCommentCount(commentsData?.totalElements || 0);
    } catch (error) {
      console.error("Failed to post reply:", error);
      Alert.alert("Error", "Failed to post reply. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };


  if (!current) {
    return <View style={{ flex: 1, backgroundColor: "black" }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Swipeable image list */}
      <FlatList
        ref={flatListRef}
        data={media}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableWithoutFeedback onPress={toggleUI}>
            <View style={{ width: SCREEN_WIDTH, height: "100%", alignItems: "center", justifyContent: "center" }}>
              <AuthenticatedImage
                source={{ uri: item.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
        )}
        scrollEnabled={true}
      />

      {/* top bar */}
      {showUI && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            right: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
          }}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems:"center", justifyContent:"center",
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>

          <TText style={{ color: "#fff" }}>
            {String(index + 1)} / {String(media.length)}
          </TText>

          <View style={{ width: 36, height: 36 }} />
        </View>
      )}

      {/* side arrows */}
      {showUI && (
        <>
          <Pressable
            onPress={prev}
            disabled={index === 0}
            style={{
              position: "absolute", left: 8, top: "50%", marginTop: -24,
              width: 48, height: 48, borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems:"center", justifyContent:"center",
              opacity: index === 0 ? 0.4 : 1,
              zIndex: 10,
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Pressable
            onPress={nextM}
            disabled={index >= media.length - 1}
            style={{
              position: "absolute", right: 8, top: "50%", marginTop: -24,
              width: 48, height: 48, borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems:"center", justifyContent:"center",
              opacity: index >= media.length - 1 ? 0.4 : 1,
              zIndex: 10,
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </Pressable>
        </>
      )}

      {/* bottom bar: owner info (left) and likes/comments (right) */}
      {showUI && current && (
        <View style={{ 
          position: "absolute", 
          left: spacing.md,
          right: spacing.md, 
          bottom: insets.bottom + spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}>
          {/* Media Owner Info (Left) */}
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: spacing.md }}>
            {loadingOwner ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : mediaOwner ? (
              <>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden", marginRight: spacing.xs }}>
                  {mediaOwner.avatarPhotoReference ? (
                    <AuthenticatedImage
                      source={{ uri: getMediaFileUrl(mediaOwner.avatarPhotoReference) }}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={16} color="#fff" />
                  )}
                </View>
                <TText style={{ color: "#fff", fontSize: 13, fontWeight: "500" }} numberOfLines={1}>
                  {mediaOwner.displayName || mediaOwner.username || "Unknown"}
                </TText>
              </>
            ) : null}
          </View>

          {/* Comments and Likes (Right) */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Comments */}
            <Pressable
              onPress={() => setShowCommentsSheet(true)}
              style={{ flexDirection: "row", alignItems: "center", marginRight: spacing.md }}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
              <TText style={{ color: "#fff", fontSize: 14, fontWeight: "500", marginLeft: 4 }}>
                {String(commentCount)}
              </TText>
            </Pressable>
            
            {/* Likes */}
            <Pressable
              onPress={handleLikeToggle}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={18} 
                color={isLiked ? "#ff3040" : "#fff"} 
              />
              <TText style={{ color: "#fff", fontSize: 14, fontWeight: "500", marginLeft: 4 }}>
                {String(likeCount)}
              </TText>
            </Pressable>
          </View>
        </View>
      )}

      {/* Comments Bottom Sheet */}
      <BottomSheet
        visible={showCommentsSheet}
        onClose={() => {
          setShowCommentsSheet(false);
          setReplyingTo(null);
          setReplyText("");
        }}
        maxHeight="90%"
      >
        <CommentsSection
          comments={comments}
          loadingComments={loadingComments}
          newCommentText={newCommentText}
          setNewCommentText={setNewCommentText}
          postingComment={postingComment}
          handlePostComment={handlePostComment}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyText={replyText}
          setReplyText={setReplyText}
          handlePostReply={handlePostReply}
        />
      </BottomSheet>
    </View>
  );
}
