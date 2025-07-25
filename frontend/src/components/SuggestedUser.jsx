import { Avatar, Flex, Button, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BeautifyNumber } from "../utils/BeautifyNumber";


const SuggestedUser = ({ user }) => {
    const [followed, setFollowed] = useState(user?.is_following || false);
    const [followersCount, setFollowersCount] = useState(user?.followers_count || 0);

    const navigate = useNavigate();

    const handleFollow = () => {
        if (followed) {
            setFollowersCount(followersCount - 1);
        } else {
            setFollowersCount(followersCount + 1);
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