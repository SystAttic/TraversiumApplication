import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, FlatList, Dimensions, TouchableWithoutFeedback, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getTripById } from "../../../../../../src/services/tripApi";
import { getMediaFileUrl } from "../../../../../../src/services/fileStorageApi";
import { auth } from "../../../../../../src/services/firebase";
import { getLikeCount, getComments, likeMedia, unlikeMedia, createComment, getCommentReplies } from "../../../../../../src/services/socialApi";
import { getUserById } from "../../../../../../src/services/userApi";
import TText from "../../../../../../src/components/TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../../../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, radii } from "../../../../../../src/theme/spacing";
import AuthenticatedImage from "../../../../../../src/components/AuthenticatedImage";
import BottomSheet from "../../../../../../src/components/BottomSheet";

const UI_HIDE_AFTER = 2500;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper to format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

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
  const [expandedReplies, setExpandedReplies] = useState(new Set());
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

  // Toggle replies visibility
  const toggleReplies = async (commentId) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
      // Load replies if not already loaded
      try {
        const repliesData = await getCommentReplies(commentId, 0, 50);
        // Update comment with replies (we'll need to store this in state)
        // For now, just mark as expanded
      } catch (error) {
        console.error("Failed to load replies:", error);
      }
    }
    setExpandedReplies(newExpanded);
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

      {/* bottom bar: likes/comments */}
      {showUI && current && (
        <View style={{ 
          position: "absolute", 
          right: spacing.md, 
          bottom: insets.bottom + spacing.md,
          flexDirection: "row",
          alignItems: "center",
          zIndex: 10,
        }}>
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
        <CommentsView
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
          expandedReplies={expandedReplies}
          toggleReplies={toggleReplies}
          formatTime={formatTime}
          colors={colors}
          spacing={spacing}
        />
      </BottomSheet>
    </View>
  );
}

// Comments View Component
function CommentsView({
  comments,
  loadingComments,
  newCommentText,
  setNewCommentText,
  postingComment,
  handlePostComment,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  handlePostReply,
  expandedReplies,
  toggleReplies,
  formatTime,
  colors,
  spacing,
}) {
  const [commentReplies, setCommentReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  const loadReplies = async (commentId) => {
    if (commentReplies[commentId]) return; // Already loaded
    
    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
    try {
      const repliesData = await getCommentReplies(commentId, 0, 50);
      setCommentReplies(prev => ({ ...prev, [commentId]: repliesData?.content || [] }));
    } catch (error) {
      console.error("Failed to load replies:", error);
      setCommentReplies(prev => ({ ...prev, [commentId]: [] }));
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleToggleReplies = (commentId) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
      loadReplies(commentId);
    }
    toggleReplies(commentId);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TText weight="bold" style={{ fontSize: 18 }}>Comments</TText>
      </View>

      {/* Comments List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
        {loadingComments ? (
          <View style={{ alignItems: "center", padding: spacing.xl }}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
          </View>
        ) : comments.length === 0 ? (
          <View style={{ alignItems: "center", padding: spacing.xl }}>
            <TText dim>No comments yet. Be the first to comment!</TText>
          </View>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handlePostReply={handlePostReply}
              expandedReplies={expandedReplies}
              handleToggleReplies={handleToggleReplies}
              commentReplies={commentReplies[comment.commentId] || []}
              loadingReplies={loadingReplies[comment.commentId]}
              formatTime={formatTime}
              colors={colors}
              spacing={spacing}
            />
          ))
        )}
      </ScrollView>

      {/* New Comment Input */}
      {replyingTo ? (
        <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg.layer2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
            <TText size="sm" dim>Replying to comment</TText>
            <Pressable onPress={() => setReplyingTo(null)} style={{ marginLeft: "auto" }}>
              <Ionicons name="close" size={20} color={colors.text.muted} />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write a reply..."
              placeholderTextColor={colors.text.muted}
              multiline
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                color: colors.text.primary,
                backgroundColor: colors.bg.layer1,
                maxHeight: 100,
              }}
            />
            <Pressable
              onPress={() => handlePostReply(replyingTo)}
              disabled={!replyText.trim() || postingComment}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                backgroundColor: replyText.trim() && !postingComment ? colors.accent.primary : colors.bg.layer3,
                justifyContent: "center",
              }}
            >
              {postingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg.layer2 }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TextInput
              value={newCommentText}
              onChangeText={setNewCommentText}
              placeholder="Write a comment..."
              placeholderTextColor={colors.text.muted}
              multiline
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                color: colors.text.primary,
                backgroundColor: colors.bg.layer1,
                maxHeight: 100,
              }}
            />
            <Pressable
              onPress={handlePostComment}
              disabled={!newCommentText.trim() || postingComment}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                backgroundColor: newCommentText.trim() && !postingComment ? colors.accent.primary : colors.bg.layer3,
                justifyContent: "center",
              }}
            >
              {postingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// Comment Item Component
function CommentItem({
  comment,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  handlePostReply,
  expandedReplies,
  handleToggleReplies,
  commentReplies,
  loadingReplies,
  formatTime,
  colors,
  spacing,
}) {
  const [commentUser, setCommentUser] = useState(null);

  useEffect(() => {
    if (comment.userId) {
      getUserById(comment.userId)
        .then(setCommentUser)
        .catch(() => setCommentUser(null));
    }
  }, [comment.userId]);

  const isExpanded = expandedReplies.has(comment.commentId);
  const hasReplies = comment.replyCount > 0;

  return (
    <View style={{ marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {/* Comment Content */}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {/* Avatar */}
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg.layer3, alignItems: "center", justifyContent: "center" }}>
          {commentUser?.avatarPhotoReference ? (
            <AuthenticatedImage
              source={{ uri: getMediaFileUrl(commentUser.avatarPhotoReference) }}
              style={{ width: 32, height: 32, borderRadius: 16 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={20} color={colors.text.muted} />
          )}
        </View>

        {/* Comment Text */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: 2 }}>
            <TText weight="500" size="sm">
              {commentUser?.displayName || commentUser?.username || "Unknown"}
            </TText>
            {comment.createdAt && (
              <TText dim size="xs">
                {formatTime(new Date(comment.createdAt).getTime())}
              </TText>
            )}
          </View>
          <TText size="sm" style={{ marginBottom: spacing.xs }}>
            {comment.content}
          </TText>

          {/* Reply Button */}
          <Pressable
            onPress={() => setReplyingTo(comment.commentId)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs }}
          >
            <Ionicons name="chatbubble-outline" size={14} color={colors.text.muted} />
            <TText dim size="xs">Reply</TText>
          </Pressable>
        </View>
      </View>

      {/* Replies Section */}
      {hasReplies && (
        <Pressable
          onPress={() => handleToggleReplies(comment.commentId)}
          style={{ marginTop: spacing.sm, marginLeft: 40, flexDirection: "row", alignItems: "center", gap: spacing.xs }}
        >
          <Ionicons
            name={isExpanded ? "chevron-down" : "chevron-forward"}
            size={14}
            color={colors.text.muted}
          />
          <TText dim size="xs">
            {isExpanded ? "Hide" : "Show"} {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
          </TText>
        </Pressable>
      )}

      {/* Expanded Replies */}
      {isExpanded && (
        <View style={{ marginTop: spacing.sm, marginLeft: 40 }}>
          {loadingReplies ? (
            <ActivityIndicator size="small" color={colors.accent.primary} />
          ) : commentReplies.length === 0 ? (
            <TText dim size="xs">No replies yet</TText>
          ) : (
            commentReplies.map((reply) => (
              <CommentItem
                key={reply.commentId}
                comment={reply}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                handlePostReply={handlePostReply}
                expandedReplies={expandedReplies}
                handleToggleReplies={handleToggleReplies}
                commentReplies={[]}
                loadingReplies={false}
                formatTime={formatTime}
                colors={colors}
                spacing={spacing}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}
