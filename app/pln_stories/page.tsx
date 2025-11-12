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
    const [tanggal, setTanggal] = useState("");
    const [data, setData] = useState<Lokasi[][]>([]);
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

            setImages(imagesURL)

            const prompt = `Tolong deteksi semua gambar ini. Jika ada gambar yang isinya jadwal pemeliharaan listrik maka baca dan ekstrak informasi pemeliharaan jaringan listrik dari gambar tersebut.  Sajikan output hanya dalam format JSON dengan key tanggal_pemeliharaan, unit_pelaksana dan lokasi_pemeliharaan. untuk key lokasi_pemeliharaan berupa object array dengan key ulp, waktu dan lokasi. Format tanggal_pemeliharaan harus dd MMMM YYYY`
            const responseAI = await fetch("/api/gemini/pln_stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imagesBase64, prompt }),
            });

            const dataAI = await responseAI.json();
            let dataJSON: DataPemeliharaan[] = JSON.parse(dataAI.text);

            // pastikan hasilnya array
            if (!Array.isArray(dataJSON)) {
                dataJSON = [dataJSON];
            }

            const dataLokasi: Lokasi[] = dataJSON.flatMap(detail => detail.lokasi_pemeliharaan);
            const chunk = chunkArray(dataLokasi, 4)

            setData(chunk);

            if (dataJSON.length > 0) {
                setTanggal(dataJSON[dataJSON.length - 1].tanggal_pemeliharaan)
            }

            if (dataJSON.length > 0) {
                const textCaption = `⚡ PENGUMUMAN PEMADAMAN JARINGAN LISTRIK ⚡

Halo, Sobat PLN! 👋

PLN UP3 Bali akan melakukan pemeliharaan jaringan listrik pada:
📅 ${dataJSON[dataJSON.length - 1].tanggal_pemeliharaan}

Sumber : @${username}

#planetdenpasar #planetkitabali #infonetizenbali #infosemetonbali #PLN #PLNBali #InfoPemeliharaan #InfoPemadaman #PLNGerakCepat #PLNSiaga #Bali #InfoPLN #PLNUpdate`;

                setCaption(textCaption)

            }


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

    const downloadAll = async () => {
        const elementHeadlineId = `headline`;
        const filenameHeadline = createFileName(); // bisa pakai index atau dt.nama kalau ada
        const elementHeadline = document.getElementById(elementHeadlineId);

        if (elementHeadline) {
            const dataHeadline = await htmlToImage.toJpeg(elementHeadline, { quality: 0.95, backgroundColor: "#ffffff" });
            const linkHeadline = document.createElement("a");
            linkHeadline.download = `${filenameHeadline}.jpeg`;
            linkHeadline.href = dataHeadline;
            linkHeadline.click();
        }

        for (let i = 0; i < data.length; i++) {
            const elementId = `canvas${i}`;
            const filename = createFileName(); // bisa pakai index atau dt.nama kalau ada
            const element = document.getElementById(elementId);

            if (!element) {
                console.warn(`Element ${elementId} not found`);
                continue;
            }

            // opsional: beri jeda agar prosesnya stabil dan tidak crash browser
            await new Promise((r) => setTimeout(r, 300));

            const dataUrl = await htmlToImage.toJpeg(element, { quality: 0.95, backgroundColor: "#ffffff" });
            const link = document.createElement("a");
            link.download = `${filename}.jpeg`;
            link.href = dataUrl;
            link.click();
        }

        toast({
            title: "Done",
            description: "All images downloaded successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "bottom-left",
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
                            <Flex justify="space-between">
                                <Button onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                    Copy Caption
                                </Button>

                                <Button
                                    colorScheme="teal"
                                    onClick={downloadAll}
                                    size="sm"

                                >
                                    Download All
                                </Button>
                            </Flex>
                            <div style={{ marginBottom: 40, marginTop: 40 }}>
                                <div id={`headline`} style={{ position: "relative", width: 340 }}>
                                    <Image src={"/images/PLN1.jpg"} w={340} fit="cover" alt="media" />
                                    <Box
                                        style={{
                                            position: "absolute",
                                            top: 212,
                                            left: 25,
                                            backgroundColor: "#14546d",
                                            textAlign: "center",
                                            borderRadius: 5,
                                            width: 180
                                        }}
                                        py={1}
                                    >
                                        <Text color={"white"} className={poppins.className} fontWeight={500}>{tanggal}</Text>
                                    </Box>

                                </div>
                                <Button
                                    colorScheme="teal"
                                    onClick={() => download(`headline`, createFileName())}
                                    size="sm"
                                    mt={4}
                                >
                                    Download
                                </Button>
                            </div>

                            {data.map((chunk, idx) => (
                                <div key={idx} style={{ marginBottom: 40, marginTop: 40 }}>
                                    <div id={`canvas${idx}`} style={{ position: "relative", width: 340 }}>
                                        <Image src={"/images/PLN-BACKGROUND.jpg"} w={340} fit="cover" alt="media" />
                                        <Box
                                            style={{
                                                position: "absolute",
                                                top: 92,
                                                left: 0,
                                                width: "100%", // penuh selebar canvas
                                                backgroundColor: "#14546d",
                                                padding: "1px",
                                                textAlign: "center",
                                            }}
                                        >
                                            <Text color={"#fff"} className={poppins.className} fontSize={14} >{tanggal}</Text>
                                        </Box>

                                        {chunk.map?.((dt2, index) => {
                                            const lokasi = Array.isArray(dt2.lokasi) ? dt2.lokasi.join(" • ") : dt2.lokasi;
                                            const posTop = index * 67 + 125;
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