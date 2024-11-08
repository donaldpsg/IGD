"use client";
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
    Checkbox,
    Center,
    Container,
    Text,
    FormLabel
} from "@chakra-ui/react";
import { useState, ChangeEvent, FormEvent, useRef, useCallback, useEffect } from "react";
import { FaPaste, FaDownload, FaArrowLeft } from "react-icons/fa";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { useRouter } from "next/navigation";
import { Icon, useToast } from "@chakra-ui/react";
import { getInstagramShortcode, hashtag } from "../config";
import { Roboto } from 'next/font/google'
import * as htmlToImage from "html-to-image";

const roboto = Roboto({
    weight: '700',
    subsets: ['latin'],
})


export default function Page() {
    const [url, setUrl] = useState('')
    const [videoURL, setVideoURL] = useState('')
    const [originalCaption, setOriginalCaption] = useState("");
    const [caption, setCaption] = useState("");
    const [repost, setRepost] = useState(true);
    const [owner, setOwner] = useState("");
    const [title, setTitle] = useState(``);
    const ffmpegRef = useRef(new FFmpeg())
    const videoRef = useRef<HTMLVideoElement | null>(null)


    const router = useRouter();
    const toast = useToast();
    const xRapidApiKey = "d1b694d66amsh95321ca4e2c7b58p1b30eajsn93ea0bad3230";

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

    useEffect(() => {
        const loadFfmpeg = async () => {
            const ffmpegInstance = new FFmpeg();
            await ffmpegInstance.load(); // Tunggu hingga ffmpeg selesai dimuat
            ffmpegRef.current = ffmpegInstance; // Simpan instance ke ref
        };
        loadFfmpeg();
    }, []);

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

    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        showToast("Loading", 4, "Please wait...");
        const shortcode = getInstagramShortcode(url);
        const apiRapid = `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${shortcode}&include_insights=true`;

        try {
            const response = await fetch(apiRapid, {
                method: "GET",
                headers: {
                    "x-rapidapi-key": xRapidApiKey, // Include your token here
                },
            });
            const res = await response.json();
            const data = res.data;

            if (data.carousel_media === undefined) {
                if (data.is_video) {
                    setVideoURL(`${data.video_versions[1].url}&dl=1`)
                }

            } else {
                for (const dt of data.carousel_media) {
                    if (dt.is_video) {
                        setVideoURL(`${dt.video_versions[1].url}&dl=1`)
                    }
                }
            }

            setOriginalCaption(data.caption.text);
            setOwner(data.user.username);

            if (repost) {
                setCaption(`${data.caption.text}\n\nRepost : @${data.user.username}\n\n${hashtag.join(" ")}`);
            } else {
                setCaption(`${data.caption.text}\n\n${hashtag.join(" ")}`);
            }

            toast.closeAll();
        } catch (e) {
            toast.closeAll();
            showToast("Error", 1, (e as Error).message);
        }
    }

    const onRepostChange = (e: ChangeEvent<HTMLInputElement>) => {
        setRepost(e.target.checked);

        if (e.target.checked) {
            setCaption(`${originalCaption}\n\nRepost : @${owner}\n\n${hashtag.join(" ")}`);
        } else {
            setCaption(`${originalCaption}\n\n${hashtag.join(" ")}`);
        }
    };

    const capitalizeWords = () => {
        const text =
            title.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

        setTitle(text)
    }

    function getVideoResolution(url: string): Promise<{ width: number, height: number }> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = url;

            // Tunggu sampai metadata video (termasuk resolusi) tersedia
            video.onloadedmetadata = () => {
                resolve({ width: video.videoWidth, height: video.videoHeight });
            };

            video.onerror = (error) => {
                reject('Gagal memuat video: ' + error);
            };
        });
    }

    const render = async () => {

        const element = document.getElementById("canvas");

        if (!element) {
            showToast("Error", 1, `Element with id "canvas" not found.`);
            return;
        }

        const videoRes = {
            width: 0,
            height: 0
        };

        getVideoResolution(videoURL)
            .then(({ width, height }) => {
                videoRes.width = width;
                videoRes.height = height;
            })
            .catch((error) => {
                console.error(error);
            });

        const dataUrl = await htmlToImage.toPng(element, {
            style: {
                backgroundColor: 'transparent',  // Pastikan latar belakang transparan
                border: 'none',                   // Hapus border jika ada
                margin: '0',                      // Hapus margin jika ada
            }
        });


        if (videoURL === "") {
            showToast("Error", 1, "Video not found");
            return
        }

        if (dataUrl === "") {
            showToast("Error", 1, "Image not found");
            return
        }

        toast({
            title: 'Loading',
            description: 'Rendering video...',
            status: 'loading',
            duration: null
        })



        const ffmpeg = ffmpegRef.current
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoURL))
        await ffmpeg.writeFile('title.png', await fetchFile(dataUrl))
        await ffmpeg.writeFile('watermark.png', await fetchFile('/images/logo-pd-watermark.png'))

        await ffmpeg.exec([
            "-i", "input.mp4",
            "-i", "title.png",
            "-i", "watermark.png",
            "-filter_complex",
            `[1:v]scale=${videoRes.width}:-1[img1]; [2:v]scale=${videoRes.width}*0.3:-1[img2]; [0:v][img1]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/1.2:enable='lt(t,3)'[tmp]; [tmp][img2]overlay=(main_w-overlay_w)/2:(main_h-overlay_w)/2`,
            "-preset", "superfast",
            "output.mp4",
        ]);

        const dataFF = (await ffmpeg.readFile('output.mp4'))

        if (videoRef.current) {
            videoRef.current.src = URL.createObjectURL(
                new Blob([dataFF], { type: "video/mp4" })
            );

            toast.closeAll()
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
            <SimpleGrid columns={{ md: 2, sm: 1 }} m={4} spacing={8}>
                <Card>
                    <CardBody>
                        <form onSubmit={(e: FormEvent<HTMLFormElement>) => submit(e)}>
                            <FormControl>
                                <InputGroup>
                                    <Input
                                        type="text"
                                        value={url}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                                        placeholder="Paste URL Instagram"
                                    />
                                    <InputRightElement>
                                        <Button onClick={paste}>
                                            <Icon as={FaPaste} color="#493628" />
                                        </Button>
                                    </InputRightElement>
                                </InputGroup>
                                <Button type="submit" leftIcon={<FaDownload />} colorScheme="teal" size="sm" mt={4} width="100%">
                                    DOWNLOAD
                                </Button>
                            </FormControl>
                        </form>
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader>
                        <Flex>
                            <Button onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                Copy Caption
                            </Button>
                            <Spacer />
                            <Checkbox defaultChecked onChange={(e) => onRepostChange(e)}>
                                Include Repost
                            </Checkbox>
                        </Flex>
                    </CardHeader>
                    <CardBody>
                        <Textarea
                            value={caption}
                            style={{ whiteSpace: "pre-wrap" }}
                            size="sm"
                            rows={caption ? 10 : 3}
                            onChange={(e) => {
                                setCaption(e.target.value);
                            }}
                        />
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
                        <Button
                            onClick={() => capitalizeWords()}
                            colorScheme="teal"
                            size="sm"
                            mt={4}
                            ml={1}
                        >
                            Capitalize
                        </Button>
                        <Button
                            onClick={() => render()}
                            colorScheme="teal"
                            size="sm"
                            mt={4}
                            ml={1}
                        >
                            Render Video
                        </Button>
                    </CardBody>
                </Card>
                <Center id="canvas" style={{ position: "relative", height: 180, border: "1px solid" }}>
                    <Container
                        style={{ position: "absolute", boxShadow: '7px 7px #148b9d' }}
                        bg="rgba(255,255,255,0.9)"
                        w="85%"
                        p={2}
                    >
                        <Text
                            fontSize={25}
                            className={roboto.className}
                            textAlign="center"
                            lineHeight={1.25}
                        >
                            {title}
                        </Text>
                    </Container>
                </Center>
                <Card>
                    <CardBody>
                        <video
                            style={{
                                height: "500px",
                            }}
                            ref={videoRef}
                            controls
                        ></video>

                    </CardBody>
                </Card>
            </SimpleGrid>
        </VStack>
    )
}