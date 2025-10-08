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
    FormLabel,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import { useRouter } from "next/navigation";
import * as htmlToImage from "html-to-image";
import { Poppins } from "next/font/google";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

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
    const [data, setData] = useState<DataPemeliharaan[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const [username, setUsername] = useState("plndistribusibali")

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

    const submit = async () => {
        toast({
            title: "Please wait",
            description: "Getting data...",
            status: "loading",
            duration: null,
        });

        try {

            const resIG = await fetch("/api/instagram/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username })
            });

            const dataIG = await resIG.json();
            const stories = dataIG.result

            const imagesBase64: string[] = [];
            const imagesURL: string[] = [];
            for (const story of stories) {
                const imageUrl = `/api/proxy?url=${encodeURIComponent(story.image_versions2.candidates[0].url)}`
                const resImage = await fetch(imageUrl);
                const base64ImageData = Buffer.from(await resImage.arrayBuffer()).toString("base64");

                imagesBase64.push(base64ImageData)
                imagesURL.push(imageUrl)
            }

            const prompt = `Tolong deteksi semua gambar ini. Jika ada gambar yang isinya jadwal pemeliharaan listrik maka baca dan ekstrak informasi pemeliharaan jaringan listrik dari gambar tersebut.  Sajikan output hanya dalam format JSON dengan key tanggal_pemeliharaan, unit_pelaksana dan lokasi_pemeliharaan. untuk key lokasi_pemeliharaan berupa object array dengan key ulp, waktu dan lokasi. Format tanggal_pemeliharaan harus dd MMMM YYYY`
            const responseAI = await fetch("/api/gemini/pln_stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imagesBase64, prompt }),
            });

            const dataAI = await responseAI.json();
            const dataJSON: DataPemeliharaan[] = JSON.parse(dataAI.text);
            setData(dataJSON);
            setImages(imagesURL)
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

    const prevSlide = () => {
        setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const nextSlide = () => {
        setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
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
                                <FormLabel>Datasource (Username)</FormLabel>
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                    placeholder="Username Instagram"
                                />
                            </FormControl>
                            <Button onClick={submit} leftIcon={<FaDownload />} colorScheme="teal" size="sm" mt={4} width="100%">
                                GET DATA
                            </Button>

                            {images.length > 0 && (
                                <Box position="relative" w={330} h={586} mt={3} overflow="hidden">
                                    <Image src={images[index]} alt="" w="full" h="full" objectFit="cover" />
                                    {/* Tombol navigasi */}
                                    <Flex position="absolute" top="50%" left="0" transform="translateY(-50%)" px={2}>
                                        <IconButton
                                            aria-label="Previous Slide"
                                            icon={<ChevronLeftIcon boxSize={8} />}
                                            onClick={prevSlide}
                                            size="sm"
                                            variant="solid"
                                            colorScheme="blue" // warna kontras
                                            borderRadius="full"
                                            boxShadow="xl"
                                        />
                                    </Flex>

                                    <Flex position="absolute" top="50%" right="0" transform="translateY(-50%)" px={2}>
                                        <IconButton
                                            aria-label="Next Slide"
                                            icon={<ChevronRightIcon boxSize={8} />}
                                            onClick={nextSlide}
                                            size="sm"
                                            variant="solid"
                                            colorScheme="blue"
                                            borderRadius="full"
                                            boxShadow="xl"
                                        />
                                    </Flex>
                                </Box>
                            )}

                        </CardBody>
                    </Card>
                    <Card>
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
                            <Button onClick={copy} mt={2} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                Copy Caption
                            </Button>

                            {data.map((dt, idx) => (
                                <div key={idx} style={{ marginTop: 40 }}>
                                    <div id={`canvas${idx}`} style={{ position: "relative", width: 340 }}>
                                        <Image src={"/images/PLN-BACKGROUND.jpg"} mt={4} w={340} fit="cover" alt="media" />
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
                                                {dt.unit_pelaksana} {" "}
                                                <Text as="span"
                                                    className={poppins.className}
                                                    fontSize={13}
                                                    fontWeight={600} color="#e62a2b">
                                                    {dt.tanggal_pemeliharaan.toUpperCase()}
                                                </Text>
                                            </Text>
                                        </Box>
                                        {dt.lokasi_pemeliharaan.map?.((dt2, index) => {
                                            const lokasi = Array.isArray(dt2.lokasi) ? dt2.lokasi.join(" • ") : dt2.lokasi;
                                            const posTop = index * 67 + 133;
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
                                                        fontSize={11}
                                                        fontWeight={600}
                                                        color="white"
                                                        p={1}
                                                        w={310}
                                                        mx={4}
                                                        h={6}
                                                        style={{
                                                            borderRightWidth: 0.5,
                                                            borderLeftWidth: 0.5,
                                                            borderColor: "#0d2644",
                                                        }}
                                                    >
                                                        <Flex justify="space-between" w="100%">
                                                            <Text>{dt2.ulp}</Text>
                                                            <Text>{dt2.waktu}</Text>
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
                                        onClick={() => download(`canvas${idx}`, createFileName())}
                                        size="sm"
                                        mt={4}
                                    >
                                        Download
                                    </Button>
                                </div>
                            ))}

                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>
        </VStack>
    )
}