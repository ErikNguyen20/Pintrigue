import { Flex, Avatar, Text } from "@chakra-ui/react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormatTimeAgo } from "../utils/FormatDate";
import { useLikeCommentAPI, useUnlikeCommentAPI } from "../utils/api_methods";

const Comment = ({ comment }) => {
    const [likesCount, setLikesCount] = useState(comment?.likes_count || 0);
    const [liked, setLiked] = useState(comment?.is_liked || false);

    useEffect(() => {
        setLikesCount(comment?.likes_count || 0);
        setLiked(comment?.is_liked || false);
    }, [comment]);

    const { mutate: likeComment } = useLikeCommentAPI();
    const { mutate: unlikeComment } = useUnlikeCommentAPI();

    const navigate = useNavigate();

    const handleLike = () => {
        if (liked) {
            setLikesCount(likesCount - 1);
            unlikeComment({ commentId: comment?.id });
        } else {
            setLikesCount(likesCount + 1);
            likeComment({ commentId: comment?.id });
        }
        setLiked(!liked);
    };

    const handleVisitProfile = (e) => {
        e.stopPropagation();
        if (!comment?.user?.username) return;

        navigate(`/${comment.user.username}`);
    }

    return (
        <Flex gap="4" w="full">
            {/* Avatar */}
            <Avatar.Root onClick={handleVisitProfile} cursor="pointer">
                <Avatar.Fallback />
                <Avatar.Image src={comment?.user?.avatar_url} />
            </Avatar.Root>

            <Flex w="full" justify="space-between" align="flex-start">
                {/* Comment content */}
                <Flex direction="column" flex="1">
                    <Text fontSize="xs">
                        <Text as="span" fontWeight="semibold" fontSize="sm" onClick={handleVisitProfile} cursor="pointer">
                            {comment?.user?.username}
                        </Text>{" "}
                        {comment?.content}
                    </Text>

                    <Flex direction="row" gap="4" mt="1">
                        <Text fontSize="xs" color="gray.500">
                            {FormatTimeAgo(comment?.created_at)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            {likesCount} {likesCount === 1 ? "like" : "likes"}
                        </Text>
                    </Flex>
                </Flex>

                {/* Like button */}
                <Flex onClick={handleLike} cursor="pointer" ml="4" mt="1">
                    {liked ? <IoHeart size={20} color="red" /> : <IoHeartOutline size={20} />}
                </Flex>
            </Flex>
        </Flex>
    );
};

export default Comment;
