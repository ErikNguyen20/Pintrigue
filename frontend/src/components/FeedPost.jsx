import { Avatar, Box, Image, Flex, Button, Text, HStack, Skeleton, SkeletonCircle, SkeletonText, useDialog } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { FaRegComment } from "react-icons/fa";

import { useLikePostAPI, useUnlikePostAPI, useFollowUserAPI, useUnfollowUserAPI } from "../utils/api_methods";
import { BeautifyNumber } from "../utils/BeautifyNumber";
import { getUsernameFromToken } from "../utils/auth";
import PostDialog from "./PostDialog";
import PostHeader from "./PostHeader";


const FeedPost = ({ post }) => {
    const [liked, setLiked] = useState(post?.is_liked || false);
    const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
    const [followed, setFollowed] = useState(post?.user?.is_following || false);

    useEffect(() => {
        setLiked(post?.is_liked || false);
        setLikesCount(post?.likes_count || 0);
        setFollowed(post?.user?.is_following || false);
    }, [post]);


    const { mutate: likePost } = useLikePostAPI();
    const { mutate: unlikePost } = useUnlikePostAPI();
    const { mutate: followUser } = useFollowUserAPI();
    const { mutate: unfollowUser } = useUnfollowUserAPI();

    const dialog = useDialog();
    const ownsAccount = post?.user?.username === getUsernameFromToken();

    const handleFollow = (e) => {
        e.stopPropagation();
        if (followed) {
            setFollowed(false);
            unfollowUser({ userId: post?.user?.id });
        } else {
            setFollowed(true);
            followUser({ userId: post?.user?.id });
        }
    }

    const handleLike = (e) => {
        e.stopPropagation();
        if (liked) {
            setLikesCount(likesCount - 1);
            unlikePost({ postId: post?.id });
        } else {
            setLikesCount(likesCount + 1);
            likePost({ postId: post?.id });
        }
        setLiked(!liked);
    }

  return (
    <Box onClick={() => dialog.setOpen(true)} _hover={{ bg: "whiteAlpha.50" }} transition="background-color 0.2s" cursor="pointer">

    {/* Heading */}
    <Flex justify="space-between" align="center" w="full" my="4">
        <PostHeader username={post?.user?.username} avatarUrl={post?.user?.avatar_url} location={post?.location} created_at={post?.created_at} />

        {!ownsAccount && (<Button size="sm" fontWeight="medium" color="blue.500" _hover={{ color: "blue.600" }} cursor="pointer" onClick={handleFollow} bg="transparent">
            {followed ? "Unfollow" : "Follow"}
        </Button>)}
    </Flex>

    {/* Content */}
    <Image
        rounded="md"
        h="200px"
        w="300px"
        fit="cover"
        src={post?.image_url}
        cursor="pointer"
    />

    {/* Likes/Comments */}
    <Flex align="center" gap="6" w="full" pt="2" mb="2" mt="auto">
        <Flex onClick={handleLike} cursor="pointer" align="center" gap="1">
            {liked ? <IoHeart size={24} color="red" /> : <IoHeartOutline size={24} />}
            <Text>{BeautifyNumber(likesCount)}</Text>
        </Flex>

        <Flex onClick={() => dialog.setOpen(true)} cursor="pointer" align="center" gap="1">
            <FaRegComment size={24} />
            <Text>{BeautifyNumber(post?.comments_count)}</Text>
        </Flex>
    </Flex>

    {/* Caption */}
    {post?.caption && (
        <Text fontSize="sm">
            <Box as="span" fontWeight="700" mr="1">
                {post?.user?.username}
            </Box>
            <Box as="span" fontWeight="400">
                {post?.caption}
            </Box>
        </Text>
    )}

    {/* Popup Dialog for post details */}
    <PostDialog dialog={dialog} post={post} />

    </Box>
  );
}


const FeedPostSkeleton = () => {
    return (
        <Box w="full" mb="8">

            {/* Header */}
            <Flex justify="space-between" align="center" w="full" mb="4">
                <HStack spacing="3">
                    <SkeletonCircle size="10" />
                    <Box>
                        <Skeleton height="10px" width="80px" mb="2" />
                        <Skeleton height="10px" width="60px" />
                    </Box>
                  </HStack>
                <Skeleton height="30px" width="70px" rounded="md" />
            </Flex>

            {/* Image */}
            <Skeleton height="200px" rounded="md" />

            {/* Likes/Comments */}
            <Flex gap="6" mt="2">
                <Skeleton height="20px" width="50px" />
                <Skeleton height="20px" width="50px" />
            </Flex>

            {/* Caption */}
            <SkeletonText noOfLines={2} spacing="2" mt="2" />
        </Box>
    );
};


FeedPost.Skeleton = FeedPostSkeleton;
export default FeedPost;