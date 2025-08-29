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
  Checkbox,
  Heading,
  FormLabel,
  Center,
  Text,
  Container,
} from "@chakra-ui/react";
import { Icon, useToast } from "@chakra-ui/react";
import { FaPaste, FaDownload, FaArrowLeft, FaPlay, FaPause, FaCamera } from "react-icons/fa";
import { useRouter } from "next/navigation";
import * as htmlToImage from "html-to-image";
import { Roboto } from "next/font/google";
import { hashtag, getInstagramShortcode } from "../config";
import puppeteer from "puppeteer";

const roboto = Roboto({
  weight: "700",
  subsets: ["latin"],
});

interface IMedia {
  url: string;
  title: string;
}

export default function Page() {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [originalCaption, setOriginalCaption] = useState("");
  const [owner, setOwner] = useState("");
  const [media, setMedia] = useState<IMedia[]>([]);
  const [repost, setRepost] = useState(true);
  const [gambar, setGambar] = useState("");
  const [title, setTitle] = useState(``);
  const [isVideo, setIsVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const router = useRouter();
  const toast = useToast();
  const xRapidApiHost = "instagram-scraper-api2.p.rapidapi.com";
  const xRapidApiKey = "93b488f6f7msh4e6c6df286868e0p1bf4c6jsn7e78bf5fa74b";

  // const accessToken = "IGQWRQOTZAPUlpXdGgxMDgwV283Nk5fVDJ2NTZAwX081UVNCLXFneDYyUEJmMWZAyODFtQTRTTWRHbVlyS041YW55MThIQUlLWU9ZANGZAsMnI4eXJUckdGV3pyMnZAQUGMzOEhyWnhhbjUzY2dIZA1FGMUMxN3RTc3BHX2sZD"

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

  const onRepostChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRepost(e.target.checked);

    if (e.target.checked) {
      setCaption(`${originalCaption}\n\nRepost : @${owner}\n\n${hashtag.join(" ")}`);
    } else {
      setCaption(`${originalCaption}\n\n${hashtag.join(" ")}`);
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
        setGambar(imgsrc);
        setIsVideo(false);
      } else {
        if (videoRef.current) {
          const videoSrc = URL.createObjectURL(new Blob([selectedFiles[0]], { type: "video/mp4" }));
          videoRef.current.src = videoSrc;
          setIsVideo(true);
          setGambar("");
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

    setGambar(canvasElement.toDataURL("image/png"));
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
      const resIG = await fetch(`/api/instagram?url=${url}`, { method: "GET", })
      const js = await resIG.json()

      const shortcode = js.code;
      const apiRapid = `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${shortcode}&include_insights=true`;

      const response = await fetch(apiRapid, {
        method: "GET",
        headers: {
          "x-rapidapi-host": xRapidApiHost,
          "x-rapidapi-key": xRapidApiKey,
        },
      });
      const res = await response.json();

      const data = res.data;

      const links: IMedia[] = [];

      if (data.carousel_media === undefined) {
        if (data.is_video) {
          links.push({
            url: `${data.video_versions[0].url}&dl=1`,
            title: "Download Video",
          });
        }
      } else {
        let i = 1;
        for (const dt of data.carousel_media) {
          if (dt.is_video) {
            links.push({
              url: `${dt.video_versions[0].url}&dl=1`,
              title: `Download Slide #${i}`,
            });
          } else {
            links.push({
              url: `${dt.thumbnail_url}&dl=1`,
              title: `Download Slide #${i}`,
            });
          }
          i++;
        }
      }

      links.push({
        url: `${data.thumbnail_url}&dl=1`,
        title: `Download Thumbnail`,
      });

      setOriginalCaption(data.caption.text);
      setOwner(data.user.username);
      setMedia(links);

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
  };
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
                    GET DATA
                  </Button>
                </FormControl>
              </form>
              {media.length > 0 && (
                <Box mt={4} p={4} display={{ md: "flex" }}>
                  <VStack ml={{ md: 4 }}>
                    {media.map((item, index) => (
                      <Button
                        key={index}
                        size="sm"
                        colorScheme="teal"
                        width="100%"
                        onClick={() => router.push(item.url)}
                      >
                        {item.title}
                      </Button>
                    ))}
                  </VStack>
                </Box>
              )}
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
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <Heading size="xs">Create Thumbnail</Heading>
            </CardHeader>
            <CardBody>
              <Card>
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
                </CardBody>
              </Card>
            </CardBody>
          </Card>

          <Center id="canvas" style={{ position: "relative", width: 380, height: 475 }}>
            <Image src="/images/logo-pd.png" w={100} style={{ position: "absolute", top: 15 }} alt="logo white" />
            <Image src={gambar ? gambar : "/images/no-image.jpg"} w={380} h={475} fit="cover" alt="media" />
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
  );
}
