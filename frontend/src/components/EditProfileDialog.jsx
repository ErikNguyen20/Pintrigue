import { useState, useEffect } from "react";
import { Flex, Text, Dialog, CloseButton, Button, Input, Textarea, Portal, Avatar } from "@chakra-ui/react";
import { useFileUploadAPI, useUpdateProfileAPI } from "../utils/api_methods";
import { toaster } from "@/components/ui/toaster"

const EditProfileDialog = ({ dialog, user }) => {
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || "");
            setBio(user.bio || "");
            setAvatarUrl(user.avatar_url);
        }
    }, [user]);


    const { mutate: uploadFile } = useFileUploadAPI();
    const { mutate: updateProfile } = useUpdateProfileAPI();


    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            // Temporarily preview local image
            reader.onloadend = () => {
                setAvatarUrl(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload file to server
            setIsLoading(true);
            uploadFile({ file }, {
                onSuccess: (response) => {
                    setIsLoading(false);
                    setAvatarUrl(response.url); // Use uploaded URL
                    toaster.create({ title: "File uploaded successfully!", type: "success" });
                },
                onError: (error) => {
                    setIsLoading(false);
                    console.error("File upload failed:", error);
                    toaster.create({ title: "File upload failed. Please try again.", type: "error" });
                }
        });
        }
    };

    const handleSave = () => {
        // Logic to save changes
        console.log("Profile updated:", { fullName, bio, avatarUrl });
        setIsLoading(true);
        updateProfile({ full_name: fullName, bio: bio, avatar_url: avatarUrl }, {
            onSuccess: () => {
                setIsLoading(false);
                dialog.setOpen(false);
                toaster.create({ title: "Profile updated successfully!", type: "success" });
            },
            onError: (error) => {
                setIsLoading(false);
                console.error("Profile update failed:", error);
                toaster.create({ title: "Profile update failed. Please try again.", type: "error" });
            }
        });
    };

    return (
        <Dialog.RootProvider value={dialog} placement="center" size="md">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Body>
                            <Flex direction="column" p="4" align="center">
                                <Text fontSize="lg" fontWeight="bold" mb="4">Edit Profile</Text>
                                <Avatar.Root boxSize={{ base: "140px", sm: "140px" }} mb="4">
                                    <Avatar.Fallback />
                                    <Avatar.Image src={avatarUrl} />
                                </Avatar.Root>

                                <Input type="file" accept="image/*" onChange={handleFileChange} />

                                <Input
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    mb="4"
                                />
                                <Textarea
                                    placeholder="Bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    mb="4"
                                />
                            </Flex>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button loading={isLoading} colorScheme="blue" onClick={handleSave}>Save</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.RootProvider>
    );
};

export default EditProfileDialog;