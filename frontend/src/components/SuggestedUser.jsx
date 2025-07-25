import { Avatar, Flex, Button, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { BeautifyNumber } from "../utils/BeautifyNumber";
import { useFollowUserAPI, useUnfollowUserAPI } from "../utils/api_methods";

const SuggestedUser = ({ user }) => {
    const [followed, setFollowed] = useState(user?.is_following || false);
    const [followersCount, setFollowersCount] = useState(user?.followers_count || 0);

    useEffect(() => {
        setFollowed(user?.is_following || false);
        setFollowersCount(user?.followers_count || 0);
    }, [user]);

    const { mutate: followUser } = useFollowUserAPI();
    const { mutate: unfollowUser } = useUnfollowUserAPI();
    
    const navigate = useNavigate();

    const handleFollow = () => {
        if (followed) {
            setFollowersCount(followersCount - 1);
            unfollowUser({ userId: user?.id });
        } else {
            setFollowersCount(followersCount + 1);
            followUser({ userId: user?.id });
        }
        setFollowed(!followed);
    };

    const handleVisitProfile = () => {
        if (!user?.username) return;
        navigate(`/${user?.username}`);
    }


    return (
        <Flex align="center" justify="space-between" w="full">
            <Flex align="center" gap="2" cursor="pointer" onClick={handleVisitProfile}>
                {/* User Avatar and Username */}
                <Avatar.Root>
                    <Avatar.Fallback />
                    <Avatar.Image src={user?.avatar_url} />
                </Avatar.Root>
                <Flex direction="column" gap="0">
                    <Text fontWeight="bold" fontSize="sm">
                        {user?.username}
                    </Text>
                    <Text color="gray.600" fontSize="sm">
                        {BeautifyNumber(followersCount)} Followers
                    </Text>
                </Flex>
            </Flex>

            {/* Follow Button */}
            <Button fontSize="sm" fontWeight="medium" color="blue.500" _hover={{ color: "blue.600" }} cursor="pointer" onClick={handleFollow} bg="transparent" px="0" minW="auto">
                {followed ? "Unfollow" : "Follow"}
            </Button>
        </Flex>
    );
}

export default SuggestedUser;