import { Box, Flex, Container, Text } from "@chakra-ui/react";
import { Toaster, toaster } from "@/components/ui/toaster";
import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import ProfileHeader from "../components/ProfileHeader";
import ProfileContent from "../components/ProfileContent";
import { useUserProfileAPI } from "../utils/api_methods";



const ProfilePage = () => {
    const [userExists, setUserExists] = useState(true);
    const { username } = useParams();

    const { data: profile, error: error } = useUserProfileAPI(username);

    useEffect(() => {
        if (error) {
            if (error.response?.status === 404) {
                toaster.create({ title: "User not found.", type: "error" });
            }
            setUserExists(false);
        }
        else {
            setUserExists(true);
        }
    }, [profile, error]);

    return (
    <Box position="relative" minH="100vh" width="100%">
        <Toaster />

        {/* Main UI */}
        <Flex position="relative" zIndex="1" minH="100vh" px="0">
            <Navbar />

            <Box flex="1">
              <Container maxW="5xl" py="5">
                <Flex py="10" px="4" pl={{ base: 4, md: 10 }} w="full" mx="auto" direction="column" align="center">
                    <ProfileHeader user={profile} />
                </Flex>
                
                {userExists && (
                    <ProfileContent user={profile} />
                )}
                {!userExists && (
                    <Box textAlign="center" py="20">
                        <Text fontSize="xl" fontWeight="bold">This account doesn't exist</Text>
                    </Box>
                )}
              </Container>
            </Box>
        </Flex>
    </Box>
    );
}

export default ProfilePage;