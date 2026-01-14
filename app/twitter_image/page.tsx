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
    FormLabel,
    Center,
    Container,
    Heading,
    Radio,
    RadioGroup,
    Stack
} from "@chakra-ui/react";
import { Icon, useToast } from "@chakra-ui/react";
import { FaPaste, FaDownload, FaArrowLeft, FaCopy, FaPlay, FaPause, FaCamera } from "react-icons/fa";
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
    const [images, setImages] = useState<string[]>([]);
    const [imageURL, setImageUrl] = useState("");
    const [title, setTitle] = useState("")
    const [imageFile, setImageFile] = useState("")
    const [isVideo, setIsVideo] = useState(false);
    const [ratio, setRatio] = useState('1')
    const [widthThumb, setWidthThumb] = useState(380)
    const [heightThumb, setHeightThumb] = useState(676)
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

    const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        const selectedFiles = files as FileList;

        if (selectedFiles) {
            toast({
                title: "Please wait",
                description: "Rendering video...",
                status: "loading",
                duration: null,
            });

            const fileType = selectedFiles[0]["type"];
            const imageTypes = ["image/gif", "image/jpeg", "image/png", "image/jpeg", , "image/webp"];

            if (imageTypes.includes(fileType)) {
                const blob = new Blob([selectedFiles[0]]);
                const imgsrc = URL.createObjectURL(blob);
                setImageFile(imgsrc);
                setIsVideo(false);
            } else {
                if (videoRef.current) {
                    const videoSrc = URL.createObjectURL(new Blob([selectedFiles[0]], { type: "video/mp4" }));
                    videoRef.current.src = videoSrc;
                    setIsVideo(true);
                    setImageFile("");
                }
            }

            toast.closeAll();
        }
    };

    const screenShotVideo = () => {
        const videoElement = document.getElementById("video") as HTMLVideoElement;
        const canvasElement = document.getElementById("canvasElement") as HTMLCanvasElement;

        // Set canvas size to video frame size
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        // Draw the current frame of the video onto the canvas
        const context = canvasElement.getContext("2d");
        if (context) {
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        }

        setImageFile(canvasElement.toDataURL("image/png"));
    };

    const play = async () => {
        const videoElement = document.getElementById("video") as HTMLVideoElement;
        await videoElement.play();
    };

    const pause = () => {
        const videoElement = document.getElementById("video") as HTMLVideoElement;
        videoElement.pause();
    };

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

            const promptTitle = `Buatlah headline berita yang maksimal 100 karakter dari teks berikut. Output hanya berisi headline dan harus bahasa indonesia, tanpa kata pengantar atau penutup.\n${data.legacy.full_text}`
            const resTitle = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptTitle }),
            });

            if (resTitle.ok) {
                const dataTitle = await resTitle.json();

                const source = data.legacy.entities.media[0].url

                const promptCaption = `Tulis ulang berita ini sebagai caption Instagram yang mudah dicerna namun tetap formal. 
            Lengkapi juga dengan 1 hashtag populer yang terkait dengan berita. Sebelum hashtag tuliskan Sumber : ${source}/X. 
            Output hanya berisi caption dan harus dalam bahasa indonesia, tanpa kata pengantar atau penutup.\n${data.legacy.full_text}`
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


                setCaption(`${data.legacy.full_text}\n\nSource : ${source}(X)\n\n${hashtag.join(" ")}`)
                setTitle(dataTitle.text || "");
            } else {
                toast.closeAll();
                showToast("Error", 1, "Google AI Error. Unable to generate AI caption.");
            }


            const arrImage: string[] = [];
            for (const media of data.legacy.entities.media) {
                arrImage.push(media.media_url_https)
            }

            setImageUrl(arrImage[0])
            setImages(arrImage)
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

    const onChangeRatio = (value: string) => {
        setRatio(value)

        if (value === "1") {
            setWidthThumb(380)
            setHeightThumb(676)
        } else {
            setWidthThumb(380)
            setHeightThumb(475)
        }
    }

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
                            <VStack ml={{ md: 4 }} mt={4}>
                                {images.map((item, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        colorScheme="teal"
                                        width="100%"
                                        onClick={async () => {
                                            const response = await fetch(item);
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = `image-${index + 1}.jpg`; // nama file download
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            window.URL.revokeObjectURL(url);
                                        }}
                                    >
                                        {`Download image #${index + 1}`}
                                    </Button>
                                ))}
                            </VStack>

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
                            <Text fontStyle="italic" fontSize={15} style={{ whiteSpace: "pre-wrap" }}>{AICaption}</Text>

                            <Flex mt={3} mb={3}>
                                <Button leftIcon={<FaCopy />} onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                    Caption
                                </Button>
                                <Button leftIcon={<FaCopy />} onClick={copyAI} ml={2} colorScheme="teal" size="sm" disabled={AICaption ? false : true}>
                                    AI Caption
                                </Button>
                            </Flex>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Heading size="xs">THUMBNAIL HEADLINE</Heading>
                        </CardHeader>
                        <CardBody>
                            <FormControl>
                                <FormLabel>Image</FormLabel>
                                <Input type="file" accept="image/*|video/*" size="sm" onChange={(e) => onChangeFile(e)} />
                            </FormControl>
                            <FormControl mt={4}>
                                <FormLabel>Thumbnail Ratio</FormLabel>
                                <RadioGroup onChange={onChangeRatio} value={ratio}>
                                    <Stack direction='row'>
                                        <Radio value='1'>9:16</Radio>
                                        <Radio value='2'>3:4</Radio>
                                    </Stack>
                                </RadioGroup>
                            </FormControl>
                            <video id="video" ref={videoRef} controls style={{ display: isVideo ? "" : "none", marginTop: 10 }} />
                            <canvas
                                style={{
                                    display: "none",
                                }}
                                id="canvasElement"
                            ></canvas>

                            <SimpleGrid columns={6} spacing={3} mt={2}>
                                <IconButton
                                    colorScheme="teal"
                                    aria-label="Play"
                                    icon={<FaPlay />}
                                    style={{ display: isVideo ? "" : "none" }}
                                    onClick={play}
                                />
                                <IconButton
                                    colorScheme="teal"
                                    aria-label="Pause"
                                    icon={<FaPause />}
                                    style={{ display: isVideo ? "" : "none" }}
                                    onClick={pause}
                                />
                                <IconButton
                                    colorScheme="teal"
                                    aria-label="Screenshot"
                                    icon={<FaCamera />}
                                    style={{ display: isVideo ? "" : "none" }}
                                    onClick={screenShotVideo}
                                />
                            </SimpleGrid>
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
                    <Center id="canvas" style={{ position: "relative", width: widthThumb, height: heightThumb }}>
                        <Image src="/images/logo-pd.png" w={100} style={{ position: "absolute", top: 15 }} alt="logo white" />
                        <Image
                            src={
                                imageFile ? imageFile : imageURL ? `/api/proxy?url=${encodeURIComponent(imageURL)}` : "/images/no-image.jpg"
                            }
                            w={widthThumb}
                            h={heightThumb}
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