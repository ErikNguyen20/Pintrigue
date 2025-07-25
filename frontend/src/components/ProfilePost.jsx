import { Flex, GridItem, Image, Skeleton, Text, useDialog } from "@chakra-ui/react";
import { IoHeart } from "react-icons/io5";
import { FaComment } from "react-icons/fa";

import { BeautifyNumber } from "../utils/BeautifyNumber";
import PostDialog from "./PostDialog";


const ProfilePost = ({ post }) => {
    const dialog = useDialog()

    return (
        <>
        <GridItem cursor="pointer" borderRadius="4" overflow="hidden" boxShadow="md" border="1px solid" borderColor="whiteAlpha.300" position="relative" aspectRatio="1/1" onClick={() => dialog.setOpen(true)}>

            {/* Like and Comment Icons */}
            <Flex opacity="0" _hover={{ opacity: "1" }} position="absolute" top="0" left="0" right="0" bottom="0" align="center" justify="center" bg="blackAlpha.600" transition="all 0.2s ease-in-out" zIndex="1" gap="4">
                <Flex align="center" justify="center" gap="50">
                    <Flex>
                        <IoHeart size={24} color="white" />
                    </Flex>
                    <Text fontWeight="bold" ml="2">
                        {BeautifyNumber(post?.likes_count)}
                    </Text>
                </Flex>

                <Flex align="center" justify="center" gap="50">
                    <Flex>
                        <FaComment size={24} color="white" />
                    </Flex>
                    <Text fontWeight="bold" ml="2">
                        {BeautifyNumber(post?.comments_count)}
                    </Text>
                </Flex>
            </Flex>

            <Image src={post?.image_url} w="100%" h="100%" fit="cover" />
        </GridItem>

        {/* Popup Dialog for post details */}
        <PostDialog dialog={dialog} post={post} />
        </>
    );
}


const ProfilePostSkeleton = () => {
    return (
        <GridItem cursor="pointer" borderRadius="4" overflow="hidden" position="relative" aspectRatio="1/1">
            <Skeleton w="100%" h="100%" />
        </GridItem>
    );
}


ProfilePost.Skeleton = ProfilePostSkeleton;
export default ProfilePost;