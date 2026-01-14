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
  FormLabel,
  Heading
} from "@chakra-ui/react";
import { useState, ChangeEvent, FormEvent, useRef, useCallback, useEffect } from "react";
import { FaPaste, FaDownload, FaArrowLeft, FaCopy } from "react-icons/fa";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { useRouter } from "next/navigation";
import { Icon, useToast } from "@chakra-ui/react";
import { hashtag } from "../config";
import { Roboto } from "next/font/google";
import * as htmlToImage from "html-to-image";
import { DownloadIcon } from "@chakra-ui/icons";

const roboto = Roboto({
  weight: "700",
  subsets: ["latin"],
});

export default function Page() {
  const [url, setUrl] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [videoSrc, setVideoSrc] = useState("");
  const [originalCaption, setOriginalCaption] = useState("");
  const [caption, setCaption] = useState("");
  const [AICaption, setAICaption] = useState("");
  const [repost, setRepost] = useState(true);
  const [owner, setOwner] = useState("");
  const [title, setTitle] = useState(``);
  const [fbid, setFbid] = useState("");
  const [videoWidth, setVideoWidth] = useState(0);
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
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

  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpegInstance = new FFmpeg(); // Menggunakan `FFmpeg` langsung
      await ffmpegInstance.load();
      setFfmpeg(ffmpegInstance);
    };

    loadFFmpeg();
  }, []);

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

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    showToast("Loading", 4, "Please wait...");

    try {
      const response = await fetch("/api/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      const video = document.createElement("video");
      video.src = data[0].urls[0].url;

      video.onloadedmetadata = function () {
        setVideoWidth(video.videoWidth);

        // Bebaskan URL setelah selesai digunakan
        URL.revokeObjectURL(video.src);
      };

      if (data[0].meta.title.length > 50) {
        const promptTitle = `Buatlah headline berita yang maksimal 100 karakter dari teks berikut. Output hanya berisi headline, tanpa kata pengantar atau penutup.\n${data[0].meta.title}`
        const resTitle = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptTitle }),
        });


        if (resTitle.ok) {
          const dataTitle = await resTitle.json();
          const promptCaption = `Tulis ulang berita ini sebagai caption Instagram yang mudah dicerna namun tetap formal. 
        Lengkapi juga dengan 1 hashtag populer yang terkait dengan berita. 
        Output hanya berisi caption, tanpa kata pengantar atau penutup.\n${data[0].meta.title}`
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
          setTitle(dataTitle.text || "");
        } else {
          toast.closeAll();
          showToast("Error", 1, "Google AI Error. Unable to generate AI caption.");
        }

      }


      setVideoURL(data[0].urls[0].url);
      setOriginalCaption(data[0].meta.title);
      setOwner(data[0].meta.username);
      setFbid(data[0].urls[0].url);

      if (repost) {
        setCaption(`${data[0].meta.title}\n\nRepost : @${data[0].meta.username}\n\n${hashtag.join(" ")}`);
      } else {
        setCaption(`${data[0].meta.title}\n\n${hashtag.join(" ")}`);
      }

      toast.closeAll();
    } catch (e) {
      toast.closeAll();
      showToast("Error", 1, (e as Error).message);
    }
  };

  const onRepostChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRepost(e.target.checked);

    if (e.target.checked) {
      setCaption(`${originalCaption}\n\nRepost : @${owner}\n\n${hashtag.join(" ")}`);
    } else {
      setCaption(`${originalCaption}\n\n${hashtag.join(" ")}`);
    }
  };

  const capitalizeWords = () => {
    const text = title
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    setTitle(text);
  };

  const render = async () => {
    if (videoURL === "") {
      showToast("Error", 1, "Video not found");
      return;
    }

    toast({
      title: "Please wait",
      description: "Rendering video...",
      status: "loading",
      duration: null,
    });

    if (ffmpeg) {
      await ffmpeg.load();
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoURL));
      await ffmpeg.writeFile("watermark.png", await fetchFile("/images/logo-pd-64.png"));

      const element = document.getElementById("canvas");
      if (element) {
        if (videoWidth === 720) {
          element.style.transform = `scale(0.6)`;
        } else {
          const scale = videoWidth / 1200;
          element.style.transform = `scale(${scale})`;
        }

        const dataUrl = await htmlToImage.toPng(element, {});

        await ffmpeg.writeFile("title.png", await fetchFile(dataUrl));
        await ffmpeg.exec([
          "-i",
          "input.mp4",
          "-i",
          "title.png",
          "-i",
          "watermark.png",
          "-filter_complex",
          `[1:v]trim=duration=3,setpts=PTS-STARTPTS[title]; [0:v][title]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/1.2:enable='between(t,0,3)'[watermark]; [watermark]overlay=(W-w)/2:60`,
          "-preset",
          "ultrafast",
          "-crf",
          "30",
          "output.mp4",
        ]);
      } else {
        await ffmpeg.exec([
          "-i",
          "input.mp4", // Input video
          "-i",
          "watermark.png", // Input watermark
          "-filter_complex",
          "overlay=(W-w)/2:80", // Filter overlay (posisi watermark: x=10, y=10)
          "-codec:a",
          "copy", // Salin audio tanpa encoding ulang
          "-preset",
          "ultrafast",
          "-crf",
          "30",
          "output.mp4", // Output video
        ]);
      }

      const dataFF = await ffmpeg.readFile("output.mp4");

      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(new Blob([dataFF], { type: "video/mp4" }));
        setVideoSrc(URL.createObjectURL(new Blob([dataFF], { type: "video/mp4" })));
        toast.closeAll();
      }
    }
  };

  const downloadVideo = (filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = videoSrc;
    link.click();
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
                <a href="/images/slide-pd.jpg" download="slide.jpg">
                  <Button size="sm" colorScheme="teal" width="100%" leftIcon={<DownloadIcon />} mt={2}>
                    Slide Planet Denpasar
                  </Button>
                </a>
              </FormControl>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Flex>
              <Text fontWeight="semibold">Original Caption</Text>
              <Spacer />
              <Checkbox defaultChecked onChange={(e) => onRepostChange(e)}>
                Include Repost
              </Checkbox>
            </Flex>

            <Textarea
              value={caption}
              style={{ whiteSpace: "pre-wrap" }}
              size="sm"
              my={2}
              rows={caption ? 15 : 3}
              onChange={(e) => {
                setCaption(e.target.value);
              }}
            />
            <Text mt={3} fontWeight="semibold">AI Caption</Text>
            <Text fontStyle="italic" fontSize={15} style={{ whiteSpace: "pre-wrap" }}>{AICaption}</Text>

            <Flex mt={3}>
              <Button leftIcon={<FaCopy />} onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                Original Caption
              </Button>
              <Button leftIcon={<FaCopy />} onClick={copyAI} ml={2} colorScheme="teal" size="sm" disabled={AICaption ? false : true}>
                AI Caption
              </Button>
              <Spacer />
            </Flex>

          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="xs">Create Thumbnail</Heading>
          </CardHeader>
          <CardBody>
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
            <Button onClick={() => render()} colorScheme="teal" size="sm" mt={4} ml={1}>
              Render Video
            </Button>
          </CardBody>
        </Card>
        {title !== "" && (
          <Center id="canvas" style={{ position: "relative", height: 80 }}>
            <Container
              style={{ position: "absolute", boxShadow: "7px 7px #148b9d" }}
              bg="rgba(255,255,255,0.9)"
              w="85%"
              p={2}
            >
              <Text fontSize={22} className={roboto.className} textAlign="center" lineHeight={1.1}>
                {title}
              </Text>
            </Container>
          </Center>
        )}
        <Card>
          <CardBody>
            <video
              style={{
                height: "500px",
              }}
              ref={videoRef}
              controls
            ></video>
            <Button
              onClick={() => downloadVideo(`${fbid}.mp4`)}
              colorScheme="teal"
              size="sm"
              mt={4}
              ml={1}
              width="100%"
            >
              Download
            </Button>
          </CardBody>
        </Card>
      </SimpleGrid>
    </VStack>
  );
}
