"use client";
import React, { useState, useCallback, ChangeEvent } from "react";
import {
    FormControl,
    Input,
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
    Text,
    Flex,
    Textarea,
    CardHeader,
    InputGroup,
    InputRightElement,
    Icon,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { FaArrowLeft, FaPaste } from "react-icons/fa";
import { useRouter } from "next/navigation";
import * as htmlToImage from "html-to-image";
import { Poppins } from "next/font/google";

const poppins = Poppins({
    subsets: ["latin"], // sesuaikan subset yang diperlukan
    weight: ["400", "500", "600", "700"], // pilih weight yang kamu mau
});

interface Lokasi {
    ulp: string;
    waktu: string;
    lokasi: string[];
}

interface DataPemeliharaan {
    tanggal_pemeliharaan: string;
    unit_pelaksana: string;
    lokasi_pemeliharaan: Lokasi[];
}

export default function Page() {
    const router = useRouter();
    const toast = useToast();
    const [caption, setCaption] = useState("");
    const [data, setData] = useState<DataPemeliharaan>()
    const [url, setUrl] = useState("")
    const [image, setImage] = useState("")

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

        toast({
            title: "Success",
            description: `Copied to cliboard`,
            status: "success",
            duration: 9000,
            isClosable: true,
            position: "bottom-left",
        });
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

    const submit = async () => {
        toast({
            title: "Please wait",
            description: "Getting data...",
            status: "loading",
            duration: null,
        });

        try {
            const resIG = await fetch("/api/instagram/story", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });

            const dataIG = await resIG.json();

            const story = dataIG.result
            const imageUrl = `/api/proxy?url=${encodeURIComponent(story[0].image_versions2.candidates[0].url)}`

            const resImage = await fetch(imageUrl);
            const base64ImageData = Buffer.from(await resImage.arrayBuffer()).toString("base64");

            const prompt = `Baca dan ekstrak informasi pemeliharaan jaringan listrik dari gambar ini.  Sajikan output hanya dalam format JSON dengan key tanggal_pemeliharaan, unit_pelaksana dan lokasi_pemeliharaan. untuk key lokasi_pemeliharaan berupa object array dengan key ulp, waktu dan lokasi. Format tanggal_pemeliharaan harus dd MMMM YYYY`
            const responseAI = await fetch("/api/gemini/pln", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base64ImageData, prompt }),
            });

            const dataAI = await responseAI.json();
            const dataJSON: DataPemeliharaan = JSON.parse(dataAI.text);
            setData(dataJSON)
            setImage(imageUrl)

            const textCaption = `⚡ PENGUMUMAN PEMADAMAN JARINGAN LISTRIK ⚡

Halo, Sobat PLN! 👋

PLN UP3 Bali akan melakukan pemeliharaan jaringan listrik pada:
📅 ${dataJSON.tanggal_pemeliharaan}

Sumber : ${dataIG[0].meta.sourceUrl}

#planetdenpasar #PLNBali #InfoPemadaman`;

            setCaption(textCaption)
            toast.closeAll();
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

    const download = (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);

        if (!element) {
            toast({
                title: "Error",
                description: `Element with id "${elementId}" not found.`,
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "bottom-left",
            });
            return;
        }

        htmlToImage.toJpeg(element, { quality: 0.95 }).then(function (dataUrl) {
            const link = document.createElement("a");
            link.download = `${filename}.jpeg`;
            link.href = dataUrl;
            link.click();
        });
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
                            </FormControl>
                            <Button onClick={submit} colorScheme="teal" size="sm" mt={4} ml={1}>
                                Get Data
                            </Button>
                            {image && (
                                <Image alt="" src={image} mt={4} w={330} h={586} objectFit="cover" />
                            )}
                        </CardBody>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Button onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                Copy Caption
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <Textarea
                                value={caption}
                                style={{ whiteSpace: "pre-wrap" }}
                                size="sm"
                                mb={4}
                                rows={caption ? 10 : 3}
                                onChange={(e) => {
                                    setCaption(e.target.value);
                                }}
                            />
                            <div id="canvas-pln" style={{ position: "relative", width: 340 }}>
                                <Image src={"/images/PLN-BACKGROUND.jpg"} w={340} fit="cover" alt="media" />
                                <Box
                                    style={{
                                        position: "absolute",
                                        top: 95,
                                        left: 0,
                                        width: "100%", // penuh selebar canvas
                                        backgroundColor: "#f1eb25",
                                        padding: "4px 8px",
                                        textAlign: "center",
                                    }}
                                >
                                    <Text
                                        className={poppins.className}
                                        fontSize={13}
                                        fontWeight={600}
                                        color="#14546d"
                                        whiteSpace="nowrap" // pastikan tidak wrap
                                    >
                                        {data?.unit_pelaksana} {" "}
                                        <Text as="span"
                                            className={poppins.className}
                                            fontSize={13}
                                            fontWeight={600} color="#e62a2b">
                                            {data?.tanggal_pemeliharaan.toUpperCase()}
                                        </Text>
                                    </Text>
                                </Box>
                                {data?.lokasi_pemeliharaan.map?.((dt, index) => {
                                    const lokasi = Array.isArray(dt.lokasi) ? dt.lokasi.join(" • ") : dt.lokasi;
                                    const posTop = index * 65 + 133;
                                    return (
                                        <VStack
                                            key={index}
                                            style={{
                                                position: "absolute",
                                                top: posTop,
                                            }}
                                            align="flex-start"
                                            spacing={0}
                                        >
                                            <Box
                                                bgColor="#14546d"
                                                className={poppins.className}
                                                fontSize={10}
                                                fontWeight={600}
                                                color="white"
                                                p={1}
                                                w={310}
                                                mx={4}
                                                h={6}
                                                style={{
                                                    borderWidth: 0.5,
                                                    borderColor: "#0d2644",
                                                }}
                                            >
                                                <Flex justify="space-between" w="100%">
                                                    <Text>{dt.ulp}</Text>
                                                    <Text>{dt.waktu}</Text>
                                                </Flex>

                                            </Box>
                                            <Box
                                                key={index}
                                                style={{
                                                    borderWidth: 0.5,
                                                    borderColor: "#0d2644",
                                                }}
                                                py={0.5}
                                                px={1}
                                                mx={4}
                                                w={310}
                                                h={9}
                                                alignContent={"center"}
                                                className={poppins.className}
                                                fontSize={10}
                                                fontWeight={500}
                                                whiteSpace="pre-line" // 👈 supaya \n terbaca
                                            >
                                                {lokasi}

                                            </Box>
                                        </VStack>

                                    );
                                })}
                            </div>
                            <Button
                                colorScheme="teal"
                                onClick={() => download(`canvas-pln`, createFileName())}
                                size="sm"
                                mt={4}
                            >
                                Download
                            </Button>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>
        </VStack>
    )
}