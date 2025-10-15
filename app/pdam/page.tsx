"use client";
import React, { useState, useCallback, ChangeEvent } from "react";
import {
    FormControl,
    FormLabel,
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
    Textarea,
    InputGroup,
    InputRightElement,
    Icon
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

interface DataGangguan {
    tanggal: string;
    waktu_gangguan: string;
    estimasi_pengerjaan: string;
    informasi_gangguan: string;
    area_terdampak: string[];
}


export default function Page() {
    const router = useRouter();
    const toast = useToast();

    const [url, setUrl] = useState("")
    const [urlStory, setUrlStory] = useState("")
    const [caption, setCaption] = useState("");
    const [data, setData] = useState<DataGangguan>();
    const [image, setImage] = useState("")
    const [lokasi, setLokasi] = useState<string[][]>([]);

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

    const pasteStory = async () => {
        try {
            // Check if the browser supports the Clipboard API
            if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
                // Use the Clipboard API to read text from the clipboard
                const text = await navigator.clipboard.readText();
                setUrlStory(text);
            } else {
                showToast("Error", 1, "Clipboard API is not supported in this browser.");
            }
        } catch (e) {
            showToast("Error", 1, (e as Error).message);
        }
    };

    function chunkArray<T>(array: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }

    const submit = async () => {
        toast({
            title: "Please wait",
            description: "Getting data...",
            status: "loading",
            duration: null,
        });


        let imageUrl = "";

        try {
            if (url) {

                const resIG = await fetch("/api/instagram", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url })
                });

                const dataIG = await resIG.json();

                imageUrl = `/api/proxy?url=${encodeURIComponent(dataIG[0].pictureUrl)}`
            } else {

                const resIG = await fetch("/api/instagram/story", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: urlStory })
                });
                const dataIG = await resIG.json();
                console.log(dataIG)
                const story = dataIG.result
                console.log(story)
                imageUrl = `/api/proxy?url=${encodeURIComponent(story[0].image_versions2.candidates[0].url)}`
            }

            const resImage = await fetch(imageUrl);
            const base64ImageData = Buffer.from(await resImage.arrayBuffer()).toString("base64");

            const prompt = `Deteksi gangguan air pada gambar. Sajikan output hanya dalam format JSON tanpa kata pengantar dan penutup.  Key pada object terdiri dari tanggal, waktu_gangguan, estimasi_pengerjaan, area_terdampak dan informasi_gangguan. Jika tidak ada informasi pada salah satu key maka nilainya kosongkan saja. Untuk format value dari tanggal adalah string bisa berupa sebuah tanggal atau rentang tanggal. Format tanggal harus dd MMMM yyyy. Format area_terdampak adalah array string. Format estimasi pengerjaan berupa string yang isinya durasi hari atau jam, atau rentang tanggal`
            const responseAI = await fetch("/api/gemini/pln", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base64ImageData, prompt }),
            });

            const dataAI = await responseAI.json();
            const dataJSON: DataGangguan = JSON.parse(dataAI.text);

            if (dataJSON.tanggal === dataJSON.estimasi_pengerjaan) {
                dataJSON.estimasi_pengerjaan = ""
            }
            const loc = chunkArray(dataJSON.area_terdampak, 10)

            const text = `📢 Informasi Gangguan AIR PDAM ${dataJSON.tanggal}

${dataJSON.informasi_gangguan}

Sumber : 

#planetdenpasar #planetkitabali #infonetizenbali #infosemetonbali #bali #Infogangguanair `;

            setImage(imageUrl)
            setData(dataJSON)
            setLokasi(loc)
            setCaption(text)
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
                                <FormLabel>URL Post</FormLabel>
                                <InputGroup>
                                    <Input
                                        type="text"
                                        value={url}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                                        placeholder="Paste URL Instagram Post"
                                    />
                                    <InputRightElement>
                                        <Button onClick={paste}>
                                            <Icon as={FaPaste} color="#493628" />
                                        </Button>
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <FormControl mt={4}>
                                <FormLabel>or URL Story</FormLabel>
                                <InputGroup>
                                    <Input
                                        type="text"
                                        value={urlStory}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUrlStory(e.target.value)}
                                        placeholder="Paste URL Instagram Story"
                                    />
                                    <InputRightElement>
                                        <Button onClick={pasteStory}>
                                            <Icon as={FaPaste} color="#493628" />
                                        </Button>
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>
                            <Button onClick={submit} colorScheme="teal" size="sm" mt={4} ml={1}>
                                Get Data
                            </Button>
                            {image && (
                                <Image alt="" src={image} mt={4} w={325} h={406} objectFit="cover" />
                            )}
                        </CardBody>
                    </Card>
                    <Card>
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
                            <Button mt={4} onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true} mb={4}>
                                Copy Caption
                            </Button>
                            {data && (
                                <div style={{ marginBottom: 40, marginTop: 40 }}>
                                    <div id="canvas-pdam" style={{ position: "relative", width: 340 }}>
                                        <Image src={"/images/PDAM1.jpg"} w={340} fit="cover" alt="media" />
                                        <Box
                                            style={{
                                                position: "absolute",
                                                top: 95,
                                                left: 0,
                                                width: "100%", // penuh selebar canvas
                                                padding: "4px 8px",
                                                textAlign: "center",
                                            }}
                                        >
                                            <Text
                                                className={poppins.className}
                                                fontSize={13}
                                                fontWeight={600}
                                                whiteSpace="nowrap" // pastikan tidak wrap
                                            >
                                                {data?.tanggal}
                                            </Text>
                                        </Box>
                                        {(data?.waktu_gangguan || data?.estimasi_pengerjaan) && (
                                            <Box
                                                style={{
                                                    position: "absolute",
                                                    top: 115,
                                                    left: 0,
                                                    width: "100%", // penuh selebar canvas
                                                    padding: "4px 8px",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <Text
                                                    className={poppins.className}
                                                    fontSize={11}
                                                    fontWeight={500}
                                                >
                                                    {`${data?.waktu_gangguan ?? ""} ${data?.estimasi_pengerjaan ? `(${data?.estimasi_pengerjaan})` : ""}`}
                                                </Text>
                                            </Box>
                                        )}



                                        <Box
                                            style={{
                                                position: "absolute",
                                                top: 135,
                                                left: 15,
                                                width: "91%", // penuh selebar canvas
                                                padding: "4px 8px",
                                                textAlign: "justify",
                                                lineHeight: 1.5
                                            }}
                                        >
                                            <Text
                                                className={poppins.className}
                                                fontSize={11}
                                                fontWeight={500}

                                            >
                                                {data?.informasi_gangguan}
                                            </Text>
                                        </Box>
                                    </div>
                                    <Button
                                        colorScheme="teal"
                                        onClick={() => download(`canvas-pdam`, createFileName())}
                                        size="sm"
                                        mt={4}
                                    >
                                        Download
                                    </Button>
                                    {lokasi.map?.((chunk, index) => {
                                        return (
                                            <div key={index} style={{ marginBottom: 40, marginTop: 40 }}>
                                                <div id={`canvas-pdam${index}`} style={{ position: "relative", width: 340 }}>
                                                    <Image src={"/images/PDAM-BACKGROUND.jpg"} w={340} fit="cover" alt="media" />
                                                    <Box
                                                        style={{
                                                            position: "absolute",
                                                            top: 95,
                                                            left: 0,
                                                            width: "100%", // penuh selebar canvas
                                                            padding: "4px 8px",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <Text
                                                            className={poppins.className}
                                                            fontSize={13}
                                                            fontWeight={600}
                                                            whiteSpace="nowrap" // pastikan tidak wrap
                                                        >
                                                            {data?.tanggal}
                                                        </Text>
                                                    </Box>
                                                    <Box
                                                        style={{
                                                            position: "absolute",
                                                            top: 115,
                                                            left: 0,
                                                            width: "100%", // penuh selebar canvas
                                                            padding: "4px 8px",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <Text
                                                            className={poppins.className}
                                                            fontSize={11}
                                                            fontWeight={500}
                                                        >
                                                            {`${data?.waktu_gangguan ?? ""} ${data?.estimasi_pengerjaan ? `(${data?.estimasi_pengerjaan})` : ""}`}
                                                        </Text>
                                                    </Box>

                                                    {chunk.map?.((dt2, idx) => {
                                                        const posTop = idx * 20 + 140;
                                                        return (
                                                            <VStack
                                                                key={idx}
                                                                style={{
                                                                    position: "absolute",
                                                                    top: posTop,
                                                                }}
                                                                align="flex-start"
                                                                left={10}

                                                            >
                                                                <Box
                                                                    className={poppins.className}
                                                                    fontSize={11}
                                                                    fontWeight={600}
                                                                    mx={4}
                                                                    style={{ width: "85%" }}
                                                                >
                                                                    <ul>
                                                                        <li>{dt2}</li>
                                                                    </ul>
                                                                </Box>
                                                            </VStack>
                                                        )

                                                    })}
                                                </div>
                                                <Button
                                                    colorScheme="teal"
                                                    onClick={() => download(`canvas-pdam${index}`, createFileName())}
                                                    size="sm"
                                                    mt={4}
                                                >
                                                    Download
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>

                            )}
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>
        </VStack>
    )
}