import { Flex, Text, Grid } from '@chakra-ui/react';
import { IoMdGrid } from "react-icons/io";
import { IoHeartOutline } from "react-icons/io5";
import { FaRegBookmark } from "react-icons/fa6";
import { useEffect, useState } from "react";

import ProfilePost from './ProfilePost';
import { useUserPostsAPI, useLikedUserPostsAPI, useSavedUserPostsAPI } from '../utils/api_methods';
import { useInView } from "react-intersection-observer";

const TABS = [
    { key: 'posts', label: 'Posts', icon: <IoMdGrid size={24} /> },
    { key: 'liked', label: 'Liked', icon: <IoHeartOutline size={24} /> },
    { key: 'saved', label: 'Saved', icon: <FaRegBookmark size={24} /> },
];

const ProfileContent = ({ user }) => {
    const [activeTab, setActiveTab] = useState('posts');

    // Select API hook based on activeTab
    const apiHooks = {
        posts: useUserPostsAPI,
        liked: useLikedUserPostsAPI,
        saved: useSavedUserPostsAPI,
    };
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = apiHooks[activeTab](user?.username);

    const { ref, inView } = useInView({ threshold: 1 });

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

    return (
        <Flex px={{ base: 2, md: 4 }} w="full" mx="auto" direction="column" borderTop="1px solid gray">
            {/* Tabs */}
            <Flex w="full" justify="center" align="center" mb="4" gap={{ base: 4, md: 10 }}>
                {TABS.map(tab => (
                    <Flex
                        key={tab.key}
                        borderTop={activeTab === tab.key ? "1px solid white" : "none"}
                        align="center"
                        p="3"
                        gap="1"
                        cursor="pointer"
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon}
                        <Text
                            fontSize={{ base: "sm", md: "md" }}
                            display={{ base: "none", sm: "block" }}
                            fontWeight="medium"
                        >
                            {tab.label}
                        </Text>
                    </Flex>
                ))}
            </Flex>
        
            {/* Profile Posts */}
            <Grid templateColumns="repeat(3, 1fr)" gap={1} w="full">
                {isLoading && (
                    Array.from({ length: 6 }).map((_, i) => <ProfilePost.Skeleton key={i} />)
                )}

                {allPosts.map((post) => (
                    <ProfilePost key={post.id} post={post} />
                ))}

            </Grid>

            {/* Infinite Scroll Trigger */}
            {/* Intersection Observer target */}
            {hasNextPage && (
                <div ref={ref}>
                    {isFetchingNextPage && <ProfilePost.Skeleton />}
                </div>
            )}


        </Flex>
    );
}

export default ProfileContent;