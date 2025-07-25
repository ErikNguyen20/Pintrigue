import { Box, Flex, Link, useBreakpointValue, useDialog } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useColorModeValue } from "@/components/ui/color-mode";
import { Tooltip } from "@/components/ui/tooltip";
import { IoMdHome, IoIosSearch, IoIosAddCircleOutline, IoIosNotificationsOutline } from "react-icons/io";
import { CgAddR, CgProfile } from "react-icons/cg";
import { SlLogout } from "react-icons/sl";

import { toaster } from "@/components/ui/toaster"
import { logout } from "../utils/api"
import { getUsernameFromToken } from "../utils/auth";
import CreatePostDialog from "./CreatePostDialog";


const Navbar = () => {
    const showLogout = useBreakpointValue({ base: false, md: true });
    const placement = useBreakpointValue({ base: "top", md: "right-end" });
    const bg = useColorModeValue("white", "black");

    const navigate = useNavigate();
    const dialog = useDialog();

    const username = getUsernameFromToken() || "";
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
    <Box
        pointerEvents="auto"
        position={{ base: "fixed", md: "sticky" }}
        top={{ base: "auto", md: 0 }}
        bottom={{ base: 0, md: "auto" }}
        left="0"
        right={{ base: 0, md: "auto" }}
        zIndex="1000"
        height={{ base: "auto", md: "100vh" }}
        width={{ base: "100%", md: "200px" }}
        borderTop={{ base: "1px solid gray", md: "none" }}
        borderRight={{ base: "none", md: "1px solid gray" }}
        // Padding for bar, minimal for bottom bar
        py={{ base: 2, md: 8 }}
        px={{ base: 2, md: 4 }}
        bg={bg}
    >
      <Flex
        direction={{ base: "row", md: "column" }}
        justify={{ base: "space-around", md: "flex-start" }}
        align="center"
        w="full"
        height="full"
      >
        <Flex direction={{ base: "row", md: "column" }} gap={{ base: 0, md: 5 }} justify={{ base: "flex-start", md: "space-between" }} w="full" cursor="pointer">
            {/* Home */}
            <Tooltip hasArrow content="Home" positioning={{placement}} openDelay={500}>
                <Link
                    to="/"
                    as={RouterLink}
                    display="flex"
                    flex={{ base: 1, md: "none" }}
                    gap="4"
                    alignItems="center"
                    justifyContent={{ base: "center", md: "flex-start" }}
                    w={{ base: "auto", md: "full" }}
                    borderRadius="6"
                    p={{ base: 2, md: 0 }}
                    _hover={{ bg: "whiteAlpha.400" }}
                >
                    <IoMdHome size={24} />
                    <Box display={{ base: "none", md: "block" }} fontSize="md" fontWeight="bold">
                        Home
                    </Box>
                </Link>
            </Tooltip>

            {/* Explore */}
            <Tooltip hasArrow content="Explore" positioning={{placement}} openDelay={500}>
                <Link
                    to="/explore"
                    as={RouterLink}
                    display="flex"
                    flex={{ base: 1, md: "none" }}
                    gap="4"
                    alignItems="center"
                    justifyContent={{ base: "center", md: "flex-start" }}
                    w={{ base: "auto", md: "full" }}
                    borderRadius="6"
                    p={{ base: 2, md: 0 }}
                    _hover={{ bg: "whiteAlpha.400" }}
                >
                    <IoIosSearch size={24} />
                    <Box display={{ base: "none", md: "block" }} fontSize="md" fontWeight="bold">
                        Explore
                    </Box>
                </Link>
            </Tooltip>

            {/* Create */}
            <Tooltip hasArrow content="Create" positioning={{placement}} openDelay={500}>
                <Link
                    onClick ={() => dialog.setOpen(true)}
                    display="flex"
                    flex={{ base: 1, md: "none" }}
                    gap="4"
                    alignItems="center"
                    justifyContent={{ base: "center", md: "flex-start" }}
                    w={{ base: "auto", md: "full" }}
                    borderRadius="6"
                    p={{ base: 2, md: 0 }}
                    _hover={{ bg: "whiteAlpha.400" }}
                >
                    <CgAddR size={24} />
                    <Box display={{ base: "none", md: "block" }} fontSize="md" fontWeight="bold">
                        Create
                    </Box>
                </Link>
            </Tooltip>

            {/* Notifications */}
            <Tooltip hasArrow content="Notifications" positioning={{placement}} openDelay={500}>
                <Link
                    to="/"
                    as={RouterLink}
                    display="flex"
                    flex={{ base: 1, md: "none" }}
                    gap="4"
                    alignItems="center"
                    justifyContent={{ base: "center", md: "flex-start" }}
                    w={{ base: "auto", md: "full" }}
                    borderRadius="6"
                    p={{ base: 2, md: 0 }}
                    _hover={{ bg: "whiteAlpha.400" }}
                >
                    <IoIosNotificationsOutline size={24} />
                    <Box display={{ base: "none", md: "block" }} fontSize="md" fontWeight="bold">
                        Notifications
                    </Box>
                </Link>
            </Tooltip>

            {/* Profile */}
            <Tooltip hasArrow content="Profile" positioning={{placement}} openDelay={500}>
                <Link
                    to={`/${username}`}
                    as={RouterLink}
                    display="flex"
                    flex={{ base: 1, md: "none" }}
                    gap="4"
                    alignItems="center"
                    justifyContent={{ base: "center", md: "flex-start" }}
                    w={{ base: "auto", md: "full" }}
                    borderRadius="6"
                    p={{ base: 2, md: 0 }}
                    _hover={{ bg: "whiteAlpha.400" }}
                >
                    <CgProfile size={24} />
                    <Box display={{ base: "none", md: "block" }} fontSize="md" fontWeight="bold">
                        Profile
                    </Box>
                </Link>
            </Tooltip>
        </Flex>

        {/* Logout */}
        {showLogout && (
            <Tooltip hasArrow content="Logout" positioning={{placement}} openDelay={500}>
                <Link
                    onClick={handleLogout}
                    mt={{ base: 0, md: "auto" }}
                    display="flex"
                    gap="4"
                    alignItems="center"
                    justifyContent={{ base: "center", md: "flex-start" }}
                    w={{ base: "auto", md: "full" }}
                    borderRadius="6"
                    p={{ base: 2, md: 0 }}
                    _hover={{ bg: "whiteAlpha.400" }}
                >
                    <SlLogout size={24} />
                    <Box display={{ base: "none", md: "block" }} fontSize="md" fontWeight="bold">
                    Logout
                    </Box>
                </Link>
            </Tooltip>)
        }

      </Flex>

      <CreatePostDialog dialog={dialog} />

    </Box>
  );
};

export default Navbar;
