import { VStack, Avatar, Flex, Link, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import SuggestedUsers from "./SuggestedUsers";
import { toaster } from "@/components/ui/toaster"
import { logout } from "../utils/api.js"
import { getUsernameFromToken } from "../utils/auth";
import { useUserProfileAPI } from "../utils/api_methods";

const Sidebar = () => {
    const navigate = useNavigate();

    const username = getUsernameFromToken()
    const { data: profile } = useUserProfileAPI(username);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/auth");
        } catch (error) {
            const errorMessage = error?.response?.data?.message || "Logout failed. Please try again.";
            toaster.create({ title: errorMessage, type: "error" });
        }
    };

    return (
        <>
        <VStack py="10" px="6" gap="4">
            {/* Profile/Logout Header */}
            <Flex justify="space-between" align="center" w="full">
                <Flex align="center" gap="4">
                    <Avatar.Root>
                        <Avatar.Fallback />
                        <Avatar.Image src={profile?.avatar_url} />
                    </Avatar.Root>
                    <Text fontSize="md" fontWeight="bold">
                        {username}
                    </Text>
                </Flex>
                <Link onClick={handleLogout} fontSize="md" fontWeight="medium" color="blue.500" _hover={{ textDecoration: 'underline' }} cursor="pointer">
                    Logout
                </Link>
            </Flex>

            {/* Suggested Users Section */}
            <SuggestedUsers />

            {/* Attribution / Additional Links */}
            <Text fontSize="12" fontWeight="bold" color="gray.500">
                Made with coffee!
            </Text>
        </VStack>
        </>
    );
}

export default Sidebar