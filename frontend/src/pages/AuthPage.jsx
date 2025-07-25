import { Container, Flex, VStack, Image, Box} from "@chakra-ui/react"
import AuthForm from '../components/AuthForm.jsx'
import { Toaster } from "@/components/ui/toaster"

const AuthPage = () => {
  return (
    <Flex align={"center"} justify={"center"} minH={"100vh"} px={"4"}>
      {/*Support for toasts on this page*/}
      <Toaster />

      {/*Container of the page*/}
      <Container maxW={"container.md"} padding={0}>
        <Flex align={"center"} justify={"center"} gap={10}>
          <Box display={{ base: "none", md: "block" }}>
            <Image rounded="md" src="https://bit.ly/dan-abramov" alt="Dan Abramov" />
          </Box>

          <VStack spacing={4} align={"stretch"}>
            <AuthForm />
            <Box textAlign={"center"} fontSize={"sm"} color={"gray.500"}>
              By signing up, you agree to our Terms, Data Policy and Cookies Policy.
            </Box>

          </VStack>
        </Flex>
      </Container>
    </Flex>
  );
};

export default AuthPage;