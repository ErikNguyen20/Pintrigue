import { VStack, Flex, Text } from "@chakra-ui/react";
import SuggestedUser from "./SuggestedUser";
import { useUserSuggestionsAPI } from "../utils/api_methods";


const SuggestedUsers = () => {
    const { data: suggestions, isLoading } = useUserSuggestionsAPI();

    return (
        <>
        <Flex align="center" justify="space-between" w="full">
            <Text fontSize="sm" fontWeight="bold" color="gray.500">
                Suggested Users
            </Text>
            <Text fontSize="sm" fontWeight="medium" color="gray.200" _hover={{ textDecoration: 'underline' }} cursor="pointer">
                See All
            </Text>
        </Flex>

        <VStack py="0" px="0" gap="4" w="full">
            {/* Loading State */}
            {isLoading && (
                <Text fontSize="sm" color="gray.400">
                    Loading suggestions...
                </Text>
            )}

            {/* Suggested Users List */}
            {suggestions &&
                suggestions.map((user) => (
                    <SuggestedUser key={user.id} user={user} />
            ))}

            {/* No Suggestions Message */}
            {!isLoading && (!suggestions || suggestions?.length === 0) && (
                <Text fontSize="sm" color="gray.400">
                    No suggestions available.
                </Text>
            )}

        </VStack>
        </>
    );
}

export default SuggestedUsers;