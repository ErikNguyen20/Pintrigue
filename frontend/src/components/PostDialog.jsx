import { Flex, Image, Text, Portal, Dialog, CloseButton, Button, Group, Input, Box, Spinner, VStack } from "@chakra-ui/react";
import { IoHeart, IoHeartOutline, IoEllipsisHorizontalSharp } from "react-icons/io5";
import { FaRegComment } from "react-icons/fa";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { BeautifyNumber } from "../utils/BeautifyNumber";
import Comment from "./Comment";
import { usePostCommentsAPI, useAddCommentAPI, useLikePostAPI, useUnlikePostAPI } from "../utils/api_methods";
import PostHeader from "./PostHeader";
import PostDialogDropdownMenu from "./PostDialogDropdownMenu";
import { getUsernameFromToken } from "../utils/auth";



const PostDialog = ({ dialog, post }) => {
    const [liked, setLiked] = useState(post?.is_liked || false);
    const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
    const [commentText, setCommentText] = useState("");

    useEffect(() => {
        setLiked(post?.is_liked || false);
        setLikesCount(post?.likes_count || 0);
    }, [post]);

    const ownsAccount = post?.user?.username === getUsernameFromToken();
    const { mutate: addComment } = useAddCommentAPI();
    const { mutate: likePost } = useLikePostAPI();
    const { mutate: unlikePost } = useUnlikePostAPI();

    const handleLike = () => {
        if (liked) {
            setLikesCount(likesCount - 1);
            unlikePost({ postId: post?.id });
        } else {
            setLikesCount(likesCount + 1);
            likePost({ postId: post?.id });
        }
        setLiked(!liked);
    }

    const handleAddComment = () => {
        if (!commentText.trim()) return;

        addComment({ postId: post?.id, content: commentText });
        setCommentText("");
    };


    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePostCommentsAPI(post?.id, dialog?.open);
    const { ref, inView } = useInView({ threshold: 1 });

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    const allComments = data?.pages.flatMap((page) => page.comments) ?? [];

    return (
        <Dialog.RootProvider value={dialog} placement="center" size="xl">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Body>
                    
                    <Flex gap="4" w={{base: "90%", sm: "70%", md: "full"}} mx="auto" minH="400px">
                        <Flex direction="column" maxW="600px" w="100%" flex="1.5" justify="center">
                            {/* Image */}
                            <Image src={post?.image_url} w="100%" fit="cover" maxW="100%" />
                        </Flex>
                        <Flex flex="1" direction="column" px="4" display={{base: "none", md: "flex"}}>
                            {/* Post Header */}
                            <Flex align="center" justify="space-between">
                                <PostHeader username={post?.user?.username} avatarUrl={post?.user?.avatar_url} location={post?.location} created_at={post?.created_at} />

                                {ownsAccount && (<PostDialogDropdownMenu dialog={dialog} post={post} />)}
                            </Flex>

                            {/* Caption */}
                            {post?.caption && (
                                <Text fontSize="sm" mt="4">
                                    <Box as="span" fontWeight="700" mr="1">
                                        {post?.user?.username}
                                    </Box>
                                    <Box as="span" fontWeight="400">
                                        {post?.caption}
                                    </Box>
                                </Text>
                            )}

                            {/*Divider*/}
                            <Flex w="full" align="center" justify="center" mt="4" mb="2">
                                <Box flex="2" h="1px" bg="gray.400" />
                            </Flex>

                            {/* Comments */}
                            <VStack w="full" align="flex-start" maxH="400px" overflowY="auto" gap="4" 
                                  css={{
                                        '&::-webkit-scrollbar': {
                                            width: '0px',
                                            height: '0px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            width: '0px',
                                            height: '0px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: "transparent",
                                        },
                                    }}
                            >
                                {isLoading && <Spinner size="sm" />}

                                {/* Display comments */}
                                {allComments.map((comment) => (
                                    <Comment key={comment.id} comment={comment} />
                                ))}

                                {/* Infinite Scroll Trigger */}
                                {/* Intersection Observer target */}
                                {hasNextPage && (
                                    <Box ref={ref}>
                                        {isFetchingNextPage && <Text>Loading more...</Text>}
                                    </Box>
                                )}
                            </VStack>
                        
                            {/* Likes/Comments */}
                            <Flex align="center" gap="6" w="full" pt="2" mb="2" mt="auto">
                                <Flex onClick={handleLike} cursor="pointer" align="center" gap="1">
                                    {liked ? <IoHeart size={20} color="red" /> : <IoHeartOutline size={20} />}
                                    <Text>{BeautifyNumber(likesCount)}</Text>
                                </Flex>

                                <Flex align="center" gap="1">
                                    <FaRegComment size={20} />
                                    <Text>{BeautifyNumber(post?.comments_count)}</Text>
                                </Flex>
                            </Flex>

                            {/* Comment Posting input */}
                            <Group attached w="full" maxW="sm">
                                <Input flex="1" placeholder="Add a comment..." variant="flushed" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                                <Button bg="bg.subtle" variant="outline" color="blue.500" _hover={{ textDecoration: "underline" }} fontWeight="normal" border="0px" onClick={handleAddComment}>
                                    Post
                                </Button>
                            </Group>

                        </Flex>
                    </Flex>

                    </Dialog.Body>
                    <Dialog.CloseTrigger asChild>
                        <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.RootProvider>
    );
}

export default PostDialog;