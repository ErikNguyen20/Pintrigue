import { VStack, Button, Text, Flex, Avatar, defineStyle, useDialog } from '@chakra-ui/react';
import { useState } from 'react';
import { useColorModeValue } from "@/components/ui/color-mode";

import { useFollowUserAPI, useUnfollowUserAPI } from "../utils/api_methods";
import { BeautifyNumber } from '../utils/BeautifyNumber';
import { getUsernameFromToken } from "../utils/auth";
import EditProfileDialog from './EditProfileDialog';


const ringCss = defineStyle({ outlineWidth: "2px", outlineColor: "colorPalette.500", outlineOffset: "2px", outlineStyle: "solid" })


const ProfileHeader = ({ user }) => {
    const [followed, setFollowed] = useState(user?.is_following);

    const { mutate: followUser } = useFollowUserAPI();
    const { mutate: unfollowUser } = useUnfollowUserAPI();
    const ownsAccount = user?.username === getUsernameFromToken();

    const bg = useColorModeValue("white.600", "white");
    const hoverBg = useColorModeValue("whiteAlpha.400", "whiteAlpha.800");

    const dialog = useDialog()


    const handleFollow = (e) => {
        e.stopPropagation();
        if (followed) {
            setFollowed(false);
            unfollowUser({ userId: user?.id });
        } else {
            setFollowed(true);
            followUser({ userId: user?.id });
        }
    }

    return (
        <Flex gap={{base: 4, sm: 10}} direction={{base: "column", sm: "row"}} w="full" align="center">
            <Avatar.Root css={ringCss} colorPalette="pink" boxSize={{ base: "140px", sm: "140px" }} borderRadius="full" flexShrink={0}>
                <Avatar.Fallback />
                <Avatar.Image src={user?.avatar_url} />
            </Avatar.Root>

            <VStack align="flex-start" gap="4" mx="auto" flex="1">
                {/* Username Section */}
                <Flex gap="8" direction={{base: "column", sm: "row"}} align="center" w="full">
                    <Text fontSize={{base: "sm", sm: "lg"}} fontWeight="normal">
                        {user?.username}
                    </Text>

                    {/* Edit Profile Button */}
                    {ownsAccount && (
                    <Flex gap="4" align="center" justify="center">
                        <Button bg={bg} color="black" _hover={{ bg: hoverBg }} size={{base: "xs", md: "sm"}} fontSize={{base: "xs", md: "sm"}} fontWeight="normal" px="4" borderRadius="6" onClick={() => dialog.setOpen(true)}>
                            Edit profile
                        </Button>
                    </Flex>
                    )}

                    {/* Follow Button */}
                    {!ownsAccount && (
                        <Flex gap="4" align="center" justify="center">
                            <Button bg={bg} color="black" _hover={{ bg: hoverBg }} size={{base: "xs", md: "sm"}} fontSize={{base: "xs", md: "sm"}} fontWeight="normal" px="4" borderRadius="6" onClick={handleFollow}>
                                {followed ? "Unfollow" : "Follow"}
                            </Button>
                        </Flex>
                    )}
                </Flex>

                {/* Numbers Section */}
                <Flex align="center" gap={{base: 2, sm: 4}}>

                    <Flex direction={{ base: "column", lg: "row" }}>
                        <Text as="span" fontWeight="semibold" fontSize={{base: "sm", sm: "md"}} mr="1">
                            {BeautifyNumber(user?.posts_count)}
                        </Text>
                        <Text fontWeight="light">
                            posts
                        </Text>
                    </Flex>

                    <Flex direction={{ base: "column", lg: "row" }}>
                        <Text as="span" fontWeight="semibold" fontSize={{base: "sm", sm: "md"}} mr="1">
                            {BeautifyNumber(user?.followers_count)}
                        </Text>
                        <Text fontWeight="light">
                            followers
                        </Text>
                    </Flex>

                    <Flex direction={{ base: "column", lg: "row" }}>
                        <Text as="span" fontWeight="semibold" fontSize={{base: "sm", sm: "md"}} mr="1">
                            {BeautifyNumber(user?.following_count)}
                        </Text>
                        <Text fontWeight="light">
                            following
                        </Text>
                    </Flex>
                    
                </Flex>
                {/* Bio Section */}
                {user?.full_name && (
                    <Flex align="center" gap="4">
                        <Text fontSize="sm" fontWeight="bold">
                            {user?.full_name}
                        </Text>
                    </Flex>
                )}

                {/* Bio */}
                <Text fontSize="sm" fontWeight="normal">
                    {user?.bio}
                </Text>
            </VStack>

            {/* Popup Dialog for post details */}
            <EditProfileDialog dialog={dialog} user={user} />
        </Flex>
    );
}

export default ProfileHeader;