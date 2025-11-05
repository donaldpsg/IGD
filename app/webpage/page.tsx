"use client";
import { useState, useCallback, ChangeEvent, FormEvent, useRef } from "react";
import { FaPaste, FaDownload, FaArrowLeft, FaCopy, FaPlay, FaPause, FaCamera } from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
    FormControl,
    Input,
    InputGroup,
    InputRightElement,
    Button,
    SimpleGrid,
    Box,
    Card,
    CardBody,
    Spacer,
    VStack,
    Image,
    StackDivider,
    IconButton,
    HStack,
    Textarea,
    CardHeader,
    Heading,
    Text,
    Center,
    Container,
    FormLabel
} from "@chakra-ui/react";
import { Icon, useToast } from "@chakra-ui/react";
import { hashtag } from "../config";
import { Roboto } from "next/font/google";
import * as htmlToImage from "html-to-image";

const roboto = Roboto({
    weight: "700",
    subsets: ["latin"],
});

export default function Page() {
    const router = useRouter();
    const toast = useToast();
    const [title, setTitle] = useState("")

    const [url, setUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [imageFile, setImageFile] = useState("")
    const [isVideo, setIsVideo] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

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
        e.preventDefault()
        toast({
            title: "Please wait",
            description: "Preparing media and thumbnail...",
            status: "loading",
            duration: null,
        });

        try {

            const prompt =
                `Tulis ulang berita dari halaman berikut ${url} sebagai caption Instagram. 
                Gunakan bahasa Indonesia yang natural, padat, dan mudah dipahami.
                Pastikan hasilnya:
                1. Tetap akurat dan sesuai dengan isi berita aslinya.
                2. Tidak menyalin kalimat secara langsung (hindari plagiarisme).
                3. Memiliki struktur kalimat dan gaya penulisan yang berbeda dari sumber.
                4. Tetap menggunakan nada profesional seperti gaya media berita.
                5. Tidak menambahkan opini pribadi atau informasi baru yang tidak ada di sumber.
            Lengkapi juga dengan hashtag populer yang terkait dengan berita. 
            Output hanya berupa teks hasil penulisan ulang (tanpa tambahan komentar atau catatan).`

            const resPrompt = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });
            const data = await resPrompt.json();


            const promptTitle = `Buatlah headline berita yang maksimal 100 karakter dari teks berikut. Output hanya berisi headline dan harus bahasa indonesia, tanpa kata pengantar atau penutup.\n${data.text}`
            const resTitle = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptTitle }),
            });
            const dataTitle = await resTitle.json();

            setCaption(`${data.text}\n${hashtag.join(" ")}`)
            setTitle(dataTitle.text || "");

            toast.closeAll()

        } catch (e) {
            toast.closeAll();
            console.log(e);
            showToast("Error", 1, (e as Error).message);
        }
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
                            <Text fontWeight="semibold">URL WEBPAGE</Text>
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
                        <CardBody>

                            <Textarea
                                value={caption}
                                style={{ whiteSpace: "pre-wrap" }}
                                size="sm"
                                my={2}
                                rows={caption ? 20 : 3}
                                onChange={(e) => {
                                    setCaption(e.target.value);
                                }}
                            />

                            <Button leftIcon={<FaCopy />} onClick={copy} ml={2} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                AI Caption
                            </Button>
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
                    <Center id="canvas" style={{ position: "relative", width: 380, height: 475 }}>
                        <Image src="/images/logo-pd.png" w={100} style={{ position: "absolute", top: 15 }} alt="logo white" />
                        <Image
                            src={
                                imageFile ? imageFile : "/images/no-image.jpg"
                            }
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