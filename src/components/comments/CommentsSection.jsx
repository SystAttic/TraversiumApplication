import React, { useState, useEffect } from "react";
import { View, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import TText from "../TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../theme";
import { spacing, radii } from "../../theme/spacing";
import AuthenticatedImage from "../AuthenticatedImage";
import { getMediaFileUrl } from "../../services/fileStorageApi";
import { getUserById } from "../../services/userApi";
import { getCommentReplies } from "../../services/socialApi";

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

export default function CommentsSection({
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
}) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
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
  colors,
  spacing,
}) {
  const [commentUser, setCommentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState(false);
  const [commentReplies, setCommentReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Fetch user information
  useEffect(() => {
    if (comment.firebaseId) {
      setLoadingUser(true);
      getUserById(comment.firebaseId)
        .then((user) => {
          setCommentUser(user);
        })
        .catch((error) => {
          console.error("Failed to fetch user:", error);
          setCommentUser(null);
        })
        .finally(() => {
          setLoadingUser(false);
        });
    } else {
      setLoadingUser(false);
      setCommentUser(null);
    }
  }, [comment.firebaseId]);

  // Load replies when expanded
  const handleToggleReplies = async () => {
    if (expandedReplies) {
      setExpandedReplies(false);
      return;
    }

    setExpandedReplies(true);
    setLoadingReplies(true);
    try {
      const repliesData = await getCommentReplies(comment.commentId, 0, 50);
      setCommentReplies(repliesData?.content || []);
    } catch (error) {
      console.error("Failed to load replies:", error);
      setCommentReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  };

  const hasReplies = comment.replyCount > 0;
  const isReply = comment.parentId !== null && comment.parentId !== undefined;

  return (
    <View style={{ marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {/* Comment Content */}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {/* Avatar */}
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg.layer3, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {loadingUser ? (
            <ActivityIndicator size="small" color={colors.text.muted} />
          ) : commentUser?.avatarPhotoReference ? (
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
              {commentUser?.displayName || commentUser?.username || "Unknown User"}
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

          {/* Reply Button - Only show for top-level comments (not replies) */}
          {!isReply && (
            <Pressable
              onPress={() => setReplyingTo(comment.commentId)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs }}
            >
              <Ionicons name="chatbubble-outline" size={14} color={colors.text.muted} />
              <TText dim size="xs">Reply</TText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Replies Section - Only show for top-level comments */}
      {!isReply && hasReplies && (
        <Pressable
          onPress={handleToggleReplies}
          style={{ marginTop: spacing.sm, marginLeft: 40, flexDirection: "row", alignItems: "center", gap: spacing.xs }}
        >
          <Ionicons
            name={expandedReplies ? "chevron-down" : "chevron-forward"}
            size={14}
            color={colors.text.muted}
          />
          <TText dim size="xs">
            {expandedReplies ? "Hide" : "Show"} {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
          </TText>
        </Pressable>
      )}

      {/* Expanded Replies */}
      {!isReply && expandedReplies && (
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
