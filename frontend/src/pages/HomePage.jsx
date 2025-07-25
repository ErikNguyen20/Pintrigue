import { Button, Box, VStack, Flex, Container } from "@chakra-ui/react";
import { Toaster } from "@/components/ui/toaster"
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FeedPosts from '../components/FeedPosts.jsx'
import 'leaflet/dist/leaflet.css';


const HomePage = () => {
  return (
    <Box position="relative" minH="100vh" width="100%">
        <Toaster />

        {/* Main UI */}
        <Flex position="relative" zIndex="1" minH="100vh" px="0">
            <Navbar />

            <Box flex="1">
              <Container maxW="container.lg">
                <Flex gap="20">
                  <Box flex="2" py="10">
                    <FeedPosts />
                  </Box>
                  <Box flex="3" py="10" mr="20" display={{ base: "none", lg: "block" }} maxW="300px">
                    <Sidebar />
                  </Box>
                </Flex>
              </Container>
            </Box>
        </Flex>
    </Box>
  );
};

export default HomePage;
