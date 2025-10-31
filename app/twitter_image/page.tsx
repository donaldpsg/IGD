"use client";
import { useState, useCallback, ChangeEvent, FormEvent } from "react";
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
    FormLabel,
    Center,
    Container
} from "@chakra-ui/react";
import { Icon, useToast } from "@chakra-ui/react";
import { FaPaste, FaDownload, FaArrowLeft, FaCopy } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { hashtag } from "../config";
import { Roboto } from "next/font/google";
import * as htmlToImage from "html-to-image";

const roboto = Roboto({
    weight: "700",
    subsets: ["latin"],
});

export default function Page() {
    const [url, setUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [AICaption, setAICaption] = useState("")
    const [imageURL, setImageUrl] = useState("");
    const [title, setTitle] = useState("")

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

    function getPostIdFromXUrl(url: string): string | null {
        try {
            const parsed = new URL(url);
            const segments = parsed.pathname.split("/").filter(Boolean);

            // Cari segmen "status" lalu ambil angka sesudahnya
            const statusIndex = segments.findIndex((s) => s === "status");
            if (statusIndex !== -1 && segments[statusIndex + 1]) {
                const pid = segments[statusIndex + 1];
                // Validasi: pastikan hanya angka
                return /^\d+$/.test(pid) ? pid : null;
            }

            return null;
        } catch {
            return null;
        }
    }



    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        toast({
            title: "Please wait",
            description: "Preparing media and thumbnail...",
            status: "loading",
            duration: null,
        });

        try {
            const pid = getPostIdFromXUrl(url);

            const fd = new FormData();
            fd.append('pid', pid || "");

            const response = await fetch("/api/twitter_image", {
                method: "POST",
                body: fd
            });

            const res = await response.json();
            const data = res.data
            // console.log(data.card.legacy.binding_values[13].value.image_value.url)


            const promptTitle = `Buatlah headline berita yang maksimal 100 karakter dari teks berikut. Output hanya berisi headline dan harus bahasa indonesia, tanpa kata pengantar atau penutup.\n${data.legacy.full_text}`
            const resTitle = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptTitle }),
            });
            const dataTitle = await resTitle.json();

            const promptCaption = `Tulis ulang berita ini sebagai caption Instagram yang mudah dicerna namun tetap formal. Jika diperlukan, akhiri dengan satu pertanyaan untuk memicu komentar. Namun jangan dipaksakan harus ada pertanyaan di akhir. Lengkapi juga dengan hashtag populer yang terkait dengan berita. Output hanya berisi caption dan harus dalam bahasa indonesia, tanpa kata pengantar atau penutup.\n${data.legacy.full_text}`
            const resCaption = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptCaption }),
            });

            const dataCaption = await resCaption.json();

            if (dataCaption.text) {
                const textCaption = `${dataCaption.text} ${hashtag.join(" ")}`
                setAICaption(textCaption);
            }

            if (dataCaption.text) {
                const textCaption = `${dataCaption.text} ${hashtag.join(" ")}`
                setAICaption(textCaption);
            }

            setCaption(`${data.legacy.full_text}\n\n${hashtag.join(" ")}`)
            setImageUrl(data.card.legacy.binding_values[13].value.image_value.url)
            setTitle(dataTitle.text || "");


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

    const copyAI = () => {
        navigator.clipboard.writeText(AICaption);
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

    async function handleDownload(imageURL: string) {
        const response = await fetch("/api/x_image/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: imageURL }),
        });

        if (!response.ok) {
            alert("Download failed");
            return;
        }

        // Ambil nama file dari header
        const disposition = response.headers.get("Content-Disposition");
        let filename = "image.jpg";

        if (disposition && disposition.includes("filename=")) {
            const match = disposition.match(/filename="?([^"]+)"?/);
            if (match?.[1]) filename = match[1];
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename; // ✅ gunakan nama file dari header
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(blobUrl);
    }

    const createFileName = () => {
        // Generate a random string
        const randomString = Math.random().toString(36).substring(2, 10);

        // Get the current timestamp
        const timestamp = Date.now();

        // Construct the file name using the random string, timestamp, and extension
        const fileName = `pd_${randomString}_${timestamp}`;

        return fileName;
    };

    const downloadFrame = (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);

        if (!element) {
            showToast("Error", 1, `Element with id "${elementId}" not found.`);
            return;
        }

        htmlToImage.toJpeg(element, { quality: 0.95 }).then(function (dataUrl) {
            const link = document.createElement("a");
            link.download = `${filename}.jpeg`;
            link.href = dataUrl;
            link.click();
        });
    };

    const capitalizeWords = () => {
        const text = title
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");

        setTitle(text);
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
                            <Button
                                mt={3}
                                size="sm"
                                colorScheme="teal"
                                width="100%"
                                onClick={() => handleDownload(imageURL)}
                            >
                                Download Image
                            </Button>
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

                            <Text mt={3} fontWeight="semibold">AI Caption</Text>
                            <Text fontStyle="italic" fontSize={15}>{AICaption}</Text>

                            <Flex mt={3} mb={3}>
                                <Button leftIcon={<FaCopy />} onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                    Caption
                                </Button>
                                <Button leftIcon={<FaCopy />} onClick={copyAI} ml={2} colorScheme="teal" size="sm" disabled={AICaption ? false : true}>
                                    AI Caption
                                </Button>
                            </Flex>

                            <FormControl mt={4}>
                                <FormLabel>
                                    Title <span style={{ color: "red", fontSize: 14 }}>({`${title.trim().length}/100`})</span>
                                </FormLabel>
                                <Textarea
                                    value={title}
                                    style={{ whiteSpace: "pre-wrap" }}
                                    size="sm"
                                    rows={3}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </FormControl>

                            <Button onClick={() => capitalizeWords()} colorScheme="teal" size="sm" mt={4} ml={1}>
                                Capitalize
                            </Button>
                            <Button onClick={() => setTitle("")} colorScheme="teal" size="sm" mt={4} ml={1}>
                                Clear
                            </Button>
                        </CardBody>
                    </Card>
                    <Center id="canvas" style={{ position: "relative", width: 380, height: 475 }}>
                        <Image src="/images/logo-pd.png" w={100} style={{ position: "absolute", top: 15 }} alt="logo white" />
                        <Image
                            src={imageURL ? imageURL : "/images/no-image.jpg"}
                            w={380}
                            h={475}
                            fit="cover"
                            alt="media"
                        />
                        {title !== "" && (
                            <Container
                                style={{ position: "absolute", bottom: 40, boxShadow: "7px 7px #148b9d" }}
                                bg="rgba(255,255,255,0.9)"
                                w="85%"
                                p={2}
                            >
                                <Text fontSize={22} className={roboto.className} textAlign="center" lineHeight={1.1}>
                                    {title}
                                </Text>
                            </Container>
                        )}
                    </Center>
                    <Button onClick={() => downloadFrame("canvas", createFileName())} colorScheme="teal" size="sm">
                        Download Thumbnail
                    </Button>
                </SimpleGrid>

            </Box>
        </VStack>
    )
}