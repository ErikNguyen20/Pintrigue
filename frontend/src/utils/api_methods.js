import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { Comment } from "../models/Comment";
import { FileResponse } from "../models/FileResponse";
import { apiFetch, uploadFile } from "./api";

const POSTS_LIMIT = 9;
const FEED_LIMIT = 5;
const COMMENTS_LIMIT = 8;

/**
 * Fetches a user's profile data.
 * @param {string} username - The username of the user.
 * @returns {object} React Query useQuery result containing User instance.
 */
export const useUserProfileAPI = (username) => {
    return useQuery({
      queryKey: ["profile", username],
      queryFn: async () => {
        const data = await apiFetch(`/users/${username}`);
        return new User(data);
      },
      enabled: !!username,
    });
}

/**
 * Factory for creating infinite queries for user posts, liked posts, or saved posts.
 * @param {string} endpoint_type - The type of posts endpoint ("posts", "liked-posts", "saved-posts").
 * @returns {function} Hook for fetching paginated posts for a user.
 */
const createUserPostsQuery = (endpoint_type) => {
  return (username) =>
    useInfiniteQuery({
      queryKey: [endpoint_type, username],
      queryFn: async ({ pageParam = 0 }) => {
        const res = await apiFetch(
          `/users/${username}/${endpoint_type}?offset=${pageParam}&limit=${POSTS_LIMIT}`
        );
        return {
          posts: res.posts.map((postData) => new Post(postData)),
          nextOffset: res.isEnd ? null : pageParam + POSTS_LIMIT,
          isEnd: res.isEnd,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextOffset,
      enabled: !!username,
    });
};

/** 
 * Fetches posts created by a user.
 * @param {string} username - The username of the user.
 * @returns {object} React Query useInfiniteQuery result containing Post instances.
 */
export const useUserPostsAPI = createUserPostsQuery("posts");

/** 
 * Fetches posts liked by a user.
 * @param {string} username - The username of the user.
 * @returns {object} React Query useInfiniteQuery result containing Post instances.
 */
export const useLikedUserPostsAPI = createUserPostsQuery("liked-posts");

/** 
 * Fetches posts saved by a user.
 * @param {string} username - The username of the user.
 * @returns {object} React Query useInfiniteQuery result containing Post instances.
 */
export const useSavedUserPostsAPI = createUserPostsQuery("saved-posts");

/**
 * Fetches user suggestions for following.
 * @returns {object} React Query useQuery result containing array of User instances.
 */
export const useUserSuggestionsAPI = () => {
  return useQuery({
    queryKey: ["user-suggestions"],
    queryFn: async () => {
      const data = await apiFetch(`/users/suggestions?limit=5`);
      return data.users.map((userData) => new User(userData));
    },
  });
};

/**
 * Fetches comments for a specific post with pagination.
 * @param {string|number} postId - The ID of the post.
 * @param {boolean} enabled - Whether the query is enabled.
 * @returns {object} React Query useInfiniteQuery result containing Comment instances.
 */
export const usePostCommentsAPI = (postId, enabled=false) => {
  return useInfiniteQuery({
    queryKey: ["post-comments", postId],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await apiFetch(`/posts/${postId}/comments?offset=${pageParam}&limit=${COMMENTS_LIMIT}`);
      return {
        comments: res.comments.map((commentData) => new Comment(commentData)),
        nextOffset: res.isEnd ? null : pageParam + COMMENTS_LIMIT,
        isEnd: res.isEnd,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!postId && enabled,
  });
};

/**
 * Fetches the main post feed with pagination.
 * @returns {object} React Query useInfiniteQuery result containing Post instances.
 */
export const usePostFeedAPI = () => {
  return useInfiniteQuery({
    queryKey: ["post-feed"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await apiFetch(`/posts/feed?offset=${pageParam}&limit=${FEED_LIMIT}`);
      return {
        posts: res.posts.map((postData) => new Post(postData)),
        nextOffset: res.isEnd ? null : pageParam + FEED_LIMIT,
        isEnd: res.isEnd,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
};

/**
 * Adds a comment to a post.
 * @returns {object} React Query useMutation result for adding a comment.
 */
export const useAddCommentAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }) => {
      const data = await apiFetch("/posts/add-comment", {
        method: "POST",
        body: {
          post_id: postId,
          content,
        },
      });
      return new Comment(data);
    },
    onSuccess: (newComment, variables) => {
      // Invalidate or update the comment list cache for the post
      queryClient.invalidateQueries(["post-comments", variables.postId]);
    },
  });
};

/**
 * Likes a post.
 * @returns {object} React Query useMutation result for liking a post.
 */
export const useLikePostAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }) => {
      await apiFetch("/posts/like", {
        method: "POST",
        body: {
          post_id: postId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the post feed to refresh likes count
      queryClient.invalidateQueries(["post-feed"]);
      queryClient.invalidateQueries(["liked-posts"]);
    }
  });
};

/**
 * Unlikes a post.
 * @returns {object} React Query useMutation result for unliking a post.
 */
export const useUnlikePostAPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }) => {
      await apiFetch("/posts/unlike", {
        method: "POST",
        body: {
          post_id: postId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the post feed to refresh likes count
      queryClient.invalidateQueries(["post-feed"]);
      queryClient.invalidateQueries(["liked-posts"]);
    }
  });
};

/**
 * Likes a comment.
 * @returns {object} React Query useMutation result for liking a comment.
 */
export const useLikeCommentAPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }) => {
      await apiFetch("/posts/like-comment", {
        method: "POST",
        body: {
          comment_id: commentId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the post comments to refresh likes count
      queryClient.invalidateQueries(["post-comments"]);
    }
  });
};

/**
 * Unlikes a comment.
 * @returns {object} React Query useMutation result for unliking a comment.
 */
export const useUnlikeCommentAPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }) => {
      await apiFetch("/posts/unlike-comment", {
        method: "POST",
        body: {
          comment_id: commentId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the post comments to refresh likes count
      queryClient.invalidateQueries(["post-comments"]);
    }
  });
};

/**
 * Saves a post.
 * @returns {object} React Query useMutation result for saving a post.
 */
export const useSavePostAPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }) => {
      await apiFetch("/posts/save-post", {
        method: "POST",
        body: {
          post_id: postId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the liked posts to refresh saved status
      queryClient.invalidateQueries(["saved-posts"]);
    }
  });
};

/**
 * Unsaves a post.
 * @returns {object} React Query useMutation result for unsaving a post.
 */
export const useUnsavePostAPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }) => {
      await apiFetch("/posts/unsave-post", {
        method: "POST",
        body: {
          post_id: postId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the liked posts to refresh saved status
      queryClient.invalidateQueries(["saved-posts"]);
    }
  });
};

/**
 * Follows a user.
 * @returns {object} React Query useMutation result for following a user.
 */
export const useFollowUserAPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }) => {
      await apiFetch("/users/follow", {
        method: "POST",
        body: {
          following_user_id: userId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the user profile to refresh following status
      queryClient.invalidateQueries(["post-feed"]);
    }
  });
};

/**
 * Unfollows a user.
 * @returns {object} React Query useMutation result for unfollowing a user.
 */
export const useUnfollowUserAPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }) => {
      await apiFetch("/users/unfollow", {
        method: "POST",
        body: {
          following_user_id: userId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the user profile to refresh following status
      queryClient.invalidateQueries(["post-feed"]);
    }
  });
};

/**
 * Uploads a file to the server.
 * @returns {object} React Query useMutation result for uploading a file.
 */
export const useFileUploadAPI = () => {
  return useMutation({
    mutationFn: async ({ file }) => {
      const response = await uploadFile(file);
      return new FileResponse(response); // { url: string }
    },
  });
};

/**
 * Updates the user's profile.
 * @returns {object} React Query useMutation result for updating profile.
 */
export const useUpdateProfileAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ full_name, bio, avatar_url }) => {
      const data = await apiFetch("/users/update-profile", {
        method: "POST",
        body: {
          full_name: full_name,
          bio: bio,
          avatar_url: avatar_url,
        },
      });
      return data; // Should match UserProfileResponse
    },
    onSuccess: () => {
      // Optionally invalidate profile queries to refresh data
      queryClient.invalidateQueries(["profile"]);
    },
  });
};

/**
 * Updates the user's profile.
 * @returns {object} React Query useMutation result for updating profile.
 */
export const useCreatePostAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ image_url, caption, location_name, latitude, longitude }) => {
      const data = await apiFetch("/posts/create", {
        method: "POST",
        body: {
          image_url: image_url,
          caption: caption,
          location_name: location_name,
          latitude: latitude,
          longitude: longitude,
        },
      });
      return data;
    },
    onSuccess: () => {
      // Optionally invalidate profile queries to refresh data
      queryClient.invalidateQueries(["profile"]);
    },
  });
};

/**
 * Deletes a post.
 * @returns {object} React Query useMutation result for deleting a post.
 */
export const useDeletePostAPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }) => {
      await apiFetch("/posts/delete", {
        method: "POST",
        body: {
          post_id: postId,
        },
      });
    },
    onSuccess: () => {
      // Invalidate the post feed to refresh likes count
      queryClient.invalidateQueries(["post-feed"]);
      queryClient.invalidateQueries(["liked-posts"]);
    }
  });
};

/**
 * Fetches nearby posts.
 * @returns {object} React Query useQuery result containing array of Post instances.
 */
export const useNearbyPostsAPI = ({ longitude, latitude, zoom, isFollowingOnly=false }) => {
  return useQuery({
    queryKey: ["nearby-posts", latitude, longitude, zoom, isFollowingOnly],
    queryFn: async () => {
      const data = await apiFetch(`/posts/geographic-nearby?latitude=${latitude}&longitude=${longitude}&zoom=${zoom}&following_only=${isFollowingOnly}`);
      return data.posts.map((postData) => new Post(postData));
    },
    enabled: latitude !== null && longitude !== null && zoom !== null,
  });
};