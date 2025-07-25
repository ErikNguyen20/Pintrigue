import { Box, VStack, Input, Field, InputGroup, Button, Flex, Text } from "@chakra-ui/react";
import { PasswordInput } from "@/components/ui/password-input"
import { toaster } from "@/components/ui/toaster"

import { LuUser } from "react-icons/lu"
import { MdOutlineEmail } from "react-icons/md";
import { CiLock } from "react-icons/ci";

import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login, register } from "../utils/api.js"


const AuthForm = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [formInputs, setFormInputs] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: ""
    });

    const navigate = useNavigate();

    const handleLoginFormAuthentication = async () => {
        if (isLoading) return; // Prevent multiple submissions

        if (!formInputs.username || !formInputs.password) {
            // Show an error toast message
            toaster.create({title: "Please fill in all required fields.", type: "error"})
            return;
        }
        
        setIsLoading(true);
        const response = await login({username: formInputs.username, password: formInputs.password});
        setIsLoading(false);
        if (response.success) {
            toaster.create({ title: "Login successful!", type: "success" });
            navigate("/");
        }
        else {
            // Show an error toast message
            toaster.create({ title: response.error, type: "error" });
        }
    }

    const isValidEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email.trim());
    }

    const handleRegisterFormAuthentication = async () => {
        if (isLoading) return; // Prevent multiple submissions

        if (!formInputs.username || !formInputs.email || !formInputs.password) {
                // Show an error toast message
                toaster.create({title: "Please fill in all required fields.", type: "error"})
                return;
        }
        if(!isValidEmail(formInputs.email)) {
            // Show an error toast message
            toaster.create({title: "Please enter a valid email address.", type: "error"})
            return;
        }
        if (!formInputs.confirmPassword || formInputs.password !== formInputs.confirmPassword) {
            // Show an error toast message
            toaster.create({title: "Passwords do not match.", type: "error"})
            return;
        }

        setIsLoading(true);
        const response = await register({email: formInputs.email, username: formInputs.username, password: formInputs.password});
        setIsLoading(false);

        if (response.success) {
            toaster.create({ title: "Registration successful!", type: "success" });
            navigate("/");
        } else {
            // Show an error toast message
            toaster.create({ title: response.error, type: "error" });
        }
    }

    const handleOAuthAuthentication = (provider) => {
        
    }

    const handleForgotPassword = () => {

    }

    return (
        <>
        <Box border={"1px solid gray"} borderRadius={4} padding={5}>
            <VStack spacing={4}>

                <Field.Root required>
                    <Field.Label>Username</Field.Label>
                    <InputGroup startElement={<LuUser />}>
                        <Input placeholder="Type your username"
                            value={formInputs.username}
                            onChange={(e) => setFormInputs({...formInputs, username: e.target.value})} />
                    </InputGroup>
                    <Field.ErrorText>This field is required</Field.ErrorText>
                </Field.Root>

                {!isLogin && (
                    <Field.Root required>
                        <Field.Label>Email</Field.Label>
                        <InputGroup startElement={<MdOutlineEmail />}>
                            <Input placeholder="Type your email" type="email"
                                value={formInputs.email}
                                onChange={(e) => setFormInputs({...formInputs, email: e.target.value})} />
                        </InputGroup>
                        <Field.ErrorText>This field is required</Field.ErrorText>
                    </Field.Root>
                )}

                <Field.Root required>
                    <Field.Label>Password</Field.Label>
                    <InputGroup startElement={<CiLock />}>
                        <PasswordInput placeholder="Type your password" 
                            value={formInputs.password}
                            onChange={(e) => setFormInputs({...formInputs, password: e.target.value})} />
                    </InputGroup>
                    <Field.ErrorText>This field is required</Field.ErrorText>
                </Field.Root>

                {!isLogin && (
                    <Field.Root required>
                        <Field.Label>Confirm Password</Field.Label>
                        <InputGroup startElement={<CiLock />}>
                            <PasswordInput placeholder="Type your password again" 
                                value={formInputs.confirmPassword}
                                onChange={(e) => setFormInputs({...formInputs, confirmPassword: e.target.value})} />
                        </InputGroup>
                        <Field.ErrorText>This field is required</Field.ErrorText>
                    </Field.Root>
                )}

                {/*Forgot Password*/}
                {isLogin && (
                    <Box w="full" textAlign="right">
                        <Button size="xs" variant="plain" _hover={{ textDecoration: 'underline' }} onClick={() => handleForgotPassword()}>
                            Forgot Password?
                        </Button>
                    </Box>
                )}

                {/*Login/Register Button*/}
                <Button loading={isLoading} mt="4" w="full" bgGradient="to-r" gradientFrom="red.200" gradientTo="blue.200" size="sm" 
                        onClick={() => isLogin ? handleLoginFormAuthentication() : handleRegisterFormAuthentication()}>
                    {isLogin ? "Login" : "Register"}
                </Button>

                {/*Divider*/}
                <Flex w="full" align="center" justify="center" gap="1" my="4">
                    <Box flex="2" h="1px" bg="gray.400" />
                    <Text mx="1" color="white">OR</Text>
                    <Box flex="2" h="1px" bg="gray.400" />
                </Flex>

                {/*Authentication Providers*/}
                <Button w="70%" variant="outline" loading={isLoading} onClick={() => handleOAuthAuthentication("google")}>
                    <FcGoogle /> Log in with Google
                </Button>

                <Button w="70%" variant="outline" loading={isLoading} onClick={() => handleOAuthAuthentication("facebook")}>
                    <FaFacebook /> Log in with Facebook
                </Button>

            </VStack>
        </Box>

        {/*Toggle Login/Register*/}
        <Flex align="center" justify="center">
            { isLogin ?
            <Text fontSize="sm">
                Don&apos;t have an account?
                <Button
                variant="link"
                size="sm"
                onClick={() => setIsLogin(false)}
                _hover={{ textDecoration: 'underline' }}
                >
                Register
                </Button>
            </Text>
            :
            <Text fontSize="sm">
                Already have an account?
                <Button
                variant="link"
                size="sm"
                onClick={() => setIsLogin(true)}
                _hover={{ textDecoration: 'underline' }}
                >
                Login
                </Button>
            </Text>
        }
        </Flex>
        </>
    );
};

export default AuthForm;