"use client";
import { useState, useCallback, ChangeEvent, FormEvent, useRef } from "react";
import {
    FormControl,
    Input,
    InputGroup,
    InputRightElement,
    Button,
    SimpleGrid,
    Box,
    Card,
    CardHeader,
    CardBody,
    Flex,
    Spacer,
    VStack,
    Image,
    StackDivider,
    IconButton,
    HStack,
    Textarea,
    Text,
} from "@chakra-ui/react";
import { Icon, useToast } from "@chakra-ui/react";
import { FaPaste, FaDownload, FaArrowLeft, FaCopy } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { hashtag } from "../config";

export default function Page() {
    const [url, setUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [videoURL, setVideoURL] = useState("");
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const router = useRouter();
    const toast = useToast();

    const showToast = useCallback(
        async (title: string, iStatus: number, message: string) => {
            const listStatus = ["success", "error", "warning", "info", "loading"] as const;

            toast({
                title: title,
                description: message,
                status: listStatus[iStatus],
                duration: 9000,
                isClosable: true,
                position: "bottom-left",
            });
        },
        [toast]
    );


    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        toast({
            title: "Please wait",
            description: "Preparing media and thumbnail...",
            status: "loading",
            duration: null,
        });

        try {
            const fd = new FormData();
            fd.append('url', url);

            const response = await fetch("/api/all_media", {
                method: "POST",
                body: fd
            });

            const data = await response.json();

            const urlVideo = data.url ? data.url : data.entries[0].url
            setCaption(`${data.description}\n\n${hashtag.join(" ")}`)
            setVideoURL(urlVideo)

            if (videoRef.current) {
                videoRef.current.src = urlVideo;
            }

            toast.closeAll();

        } catch (e) {
            toast.closeAll();
            console.log(e);
            showToast("Error", 1, (e as Error).message);
        }
    }

    const copy = () => {
        navigator.clipboard.writeText(caption);
        showToast("Success", 0, "Copied to cliboard");
    };

    const paste = async () => {
        try {
            // Check if the browser supports the Clipboard API
            if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
                // Use the Clipboard API to read text from the clipboard
                const text = await navigator.clipboard.readText();
                setUrl(text);
            } else {
                showToast("Error", 1, "Clipboard API is not supported in this browser.");
            }
        } catch (e) {
            showToast("Error", 1, (e as Error).message);
        }
    };

    const handleDownload = async () => {
        const response = await fetch("/api/all_media/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: videoURL }),
        });

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const randomString = Math.random().toString(36).substring(2, 10);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `video-${randomString}.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(blobUrl);
    };

    return (
        <VStack divider={<StackDivider borderColor="gray.200" />} align="stretch">
            <Box>
                <HStack px={2} pt={2}>
                    <IconButton
                        colorScheme="teal"
                        variant="outline"
                        aria-label="Call Segun"
                        size="md"
                        icon={<FaArrowLeft />}
                        onClick={() => router.push("/")}
                    />
                    <Spacer />
                    <Image src="/images/logo-text.png" w={100} alt="logo" />
                </HStack>
            </Box>
            <Box>
                <SimpleGrid columns={{ md: 2, sm: 1 }} m={4} spacing={8}>
                    <Card>
                        <CardHeader>
                            <Text fontWeight="semibold">URL X</Text>
                        </CardHeader>
                        <CardBody>
                            <form onSubmit={(e: FormEvent<HTMLFormElement>) => submit(e)}>
                                <FormControl>
                                    <InputGroup>
                                        <Input
                                            type="text"
                                            value={url}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                                            placeholder="Paste URL"
                                        />
                                        <InputRightElement>
                                            <Button onClick={paste}>
                                                <Icon as={FaPaste} color="#493628" />
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                    <Button type="submit" leftIcon={<FaDownload />} colorScheme="teal" size="sm" mt={4} width="100%">
                                        GET DATA
                                    </Button>
                                </FormControl>
                            </form>

                        </CardBody>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Text fontWeight="semibold">DETAIL</Text>
                        </CardHeader>
                        <CardBody>
                            <Textarea
                                value={caption}
                                style={{ whiteSpace: "pre-wrap" }}
                                size="sm"
                                my={2}
                                rows={caption ? 10 : 3}
                                onChange={(e) => {
                                    setCaption(e.target.value);
                                }}
                            />

                            <Flex mt={3} mb={3}>
                                <Button leftIcon={<FaCopy />} onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                    Copy Caption
                                </Button>
                                <Button leftIcon={<FaDownload />} ml={2} onClick={handleDownload} colorScheme="teal" size="sm" disabled={videoURL ? false : true}>
                                    Download Video
                                </Button>
                            </Flex>

                            <video
                                style={{
                                    width: "400px",
                                }}
                                ref={videoRef}
                                controls
                            />
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>
        </VStack>
    )
}