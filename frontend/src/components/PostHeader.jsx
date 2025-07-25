import { Flex, Text, Avatar } from "@chakra-ui/react";
import { FormatTimeAgo } from "../utils/FormatDate";
import { useNavigate } from "react-router-dom";

const PostHeader = ({ username, avatarUrl, location, created_at }) => {
    const navigate = useNavigate();

    const handleVisitProfile = (e) => {
        e.stopPropagation();
        navigate(`/${username}`);
    }

    const handleVisitLocation = (e) => {
        e.stopPropagation();
        if (!location || (!location?.latitude && !location?.longitude) || (location?.latitude === 0 && location?.longitude === 0)) return;

        navigate(`/explore?lat=${location?.latitude}&lng=${location?.longitude}&zoom=${10}`);
    }

    return (
        <Flex align="center" gap="4">
            <Avatar.Root onClick={handleVisitProfile} cursor="pointer">
                <Avatar.Fallback />
                <Avatar.Image src={avatarUrl} />
            </Avatar.Root>
            <Flex direction="column">
                <Flex align="center" gap="2">
                    <Text fontWeight="bold" onClick={handleVisitProfile} cursor="pointer">
                        {username}
                    </Text>
                    <Text color="gray.500" fontSize="sm">- {FormatTimeAgo(created_at)} </Text>
                </Flex>
                <Text color="gray.500" fontSize="sm" onClick={handleVisitLocation} cursor="pointer">
                    {location?.name}
                </Text>
            </Flex>
        </Flex>
    );
};

export default PostHeader;