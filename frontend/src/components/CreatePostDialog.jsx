import { useState, useEffect } from "react";
import { Flex, Text, Dialog, CloseButton, Button, Input, Textarea, Portal, Checkbox, Image } from "@chakra-ui/react";
import { useGeolocated } from "react-geolocated";

import { useFileUploadAPI, useCreatePostAPI } from "../utils/api_methods";
import { toaster } from "@/components/ui/toaster"

const CreatePostDialog = ({ dialog }) => {
    const [postUrl, setPostUrl] = useState(null);
    const [caption, setCaption] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [useLocation, setUseLocation] = useState(true);
    const [manualLatitude, setManualLatitude] = useState("");
    const [manualLongitude, setManualLongitude] = useState("");

    const { mutate: uploadFile } = useFileUploadAPI();
    const { mutate: createPost } = useCreatePostAPI();

    const { coords, isGeolocationAvailable, isGeolocationEnabled, positionError, getPosition } = useGeolocated({
        positionOptions: { enableHighAccuracy: false },
        userDecisionTimeout: 10000,
    });

    useEffect(() => {
        if (!isGeolocationAvailable || !isGeolocationEnabled || !!positionError) {
            setUseLocation(false);
        }
    }, [isGeolocationAvailable, isGeolocationEnabled, positionError]);

    useEffect(() => {
        if (coords) {
            setUseLocation(true);
        }
    }, [coords]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                setPostUrl(reader.result);
            };
            reader.readAsDataURL(file);

            setIsLoading(true);
            uploadFile({ file }, {
                onSuccess: (response) => {
                    setIsLoading(false);
                    setPostUrl(response.url);
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
        const latitude = manualLatitude !== "" ? parseFloat(manualLatitude) : (useLocation && coords ? coords.latitude : null);
        const longitude = manualLongitude !== "" ? parseFloat(manualLongitude) : (useLocation && coords ? coords.longitude : null);

        console.log("Saving pin with caption:", caption, "image URL:", postUrl, "latitude:", latitude, "longitude:", longitude);
        setIsLoading(true);
        createPost({
            caption: caption,
            image_url: postUrl,
            latitude: latitude,
            longitude: longitude,
            location_name: null
        }, {
            onSuccess: () => {
                setIsLoading(false);
                dialog.setOpen(false);
                toaster.create({ title: "Pin created successfully!", type: "success" });
            },
            onError: (error) => {
                setIsLoading(false);
                console.error("Pin creation failed:", error);
                toaster.create({ title: "Pin creation failed. Please try again.", type: "error" });
            }
        });
    };

    useEffect(() => {
        if (!dialog.open) {
            // Reset all form states here
            setPostUrl(null);
            setCaption("");
            setUseLocation(true);
            setManualLatitude("");
            setManualLongitude("");
            setIsLoading(false);
        }
    }, [dialog.open]);

    return (
        <Dialog.RootProvider value={dialog} placement="center" size="md">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Body>
                            <Flex direction="column" p="4" align="center">
                                <Text fontSize="lg" fontWeight="bold" mb="4">Create Pin</Text>

                                <Flex direction="column" maxW="600px" w="100%" flex="1.5">
                                    {postUrl && <Image src={postUrl} w="100%" fit="cover" maxW="100%" />}
                                </Flex>

                                <Input type="file" accept="image/*" onChange={handleFileChange} mt="4" />

                                <Textarea
                                    placeholder="Caption"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    mb="4"
                                    mt="2"
                                />

                                <Checkbox.Root
                                    checked={useLocation}
                                    onCheckedChange={(e) => {
                                        const checked = !!e.checked;
                                        setUseLocation(checked);
                                        if (checked && getPosition) {
                                            getPosition();
                                        }
                                    }}
                                    disabled={!isGeolocationAvailable || !isGeolocationEnabled || !!positionError}
                                    mb="2"
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label>Use Location</Checkbox.Label>
                                </Checkbox.Root>

                                {/* <Flex direction="column" w="100%" mb="4">
                                    <Input
                                        placeholder="Latitude (optional)"
                                        value={manualLatitude}
                                        onChange={(e) => setManualLatitude(e.target.value)}
                                        mb="2"
                                    />
                                    <Input
                                        placeholder="Longitude (optional)"
                                        value={manualLongitude}
                                        onChange={(e) => setManualLongitude(e.target.value)}
                                    />
                                </Flex> */}

                                {(!isGeolocationAvailable || !isGeolocationEnabled || !!positionError) && (
                                    <Flex direction="column" align="start" mb="2">
                                        <Text fontSize="xs" color="red.500" mb="1">
                                            Location permission denied or unavailable.
                                        </Text>
                                        {typeof getPosition === 'function' && (
                                            <Button size="xs" variant="outline" onClick={() => getPosition()}>
                                                Retry Location Access
                                            </Button>
                                        )}
                                    </Flex>
                                )}
                            </Flex>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button isLoading={isLoading} colorScheme="blue" onClick={handleSave}>Create</Button>
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

export default CreatePostDialog;
