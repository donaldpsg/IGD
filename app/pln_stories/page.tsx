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

            const hariIni = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });


            const prompt = `Terdapat beberapa gambar yang diunggah. Tugas Anda adalah melakukan ekstraksi data yang sangat spesifik:

                1. PERIKSA TANGGAL: Cari gambar yang secara eksplisit mencantumkan tanggal "${hariIni}".
                2. FILTER KETAT: Jika sebuah gambar mencantumkan tanggal LAIN (misal: 5 Maret), BERHENTI membaca gambar tersebut. JANGAN mengambil lokasi manapun dari gambar yang tanggalnya tidak cocok.
                3. EKSTRAKSI: Hanya dari gambar yang bertanggal "${hariIni}", ambil data:
                - unit_pelaksana (contoh: PLN UP3 BALI TIMUR)
                - lokasi_pemeliharaan: daftar objek { ulp, waktu, lokasi }

                Output harus murni JSON:
                {
                "tanggal_pemeliharaan": "${hariIni}",
                "unit_pelaksana": "...",
                "lokasi_pemeliharaan": [
                    { "ulp": "...", "waktu": "...", "lokasi": "..." }
                ]
                }

                Urutan: Denpasar, Badung, baru kota lainnya. Jika tidak ada yang cocok dengan "${hariIni}", kembalikan {}.`;

            const responseAI = await fetch("/api/gemini/pln_stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imagesBase64, prompt }),
            });

            if (responseAI.ok) {
                const dataAI = await responseAI.json();
                let dataJSON: DataPemeliharaan[] = JSON.parse(dataAI.text);

                // pastikan hasilnya array
                if (!Array.isArray(dataJSON)) {
                    dataJSON = [dataJSON];
                }

                const dataLokasi: Lokasi[] = dataJSON.flatMap(detail => detail.lokasi_pemeliharaan);

                // Chunking dinamis berdasarkan estimasi tinggi per item
                // Canvas width=340, gambar asli 1080x1350 → tinggi natural = 340*(1350/1080) = 425px
                // PaddingTop 125px untuk header → sisa usable = 425-125-20(pb) = 280px
                // Gunakan 240px agar ada margin aman di bawah
                const CANVAS_USABLE_HEIGHT = 240; // px, area tersedia (konservatif)
                const HEADER_HEIGHT = 24; // h={6} = 6*4px = 24px
                const LOKASI_MIN_HEIGHT = 56; // minH={14} = 14*4px = 56px
                const CHARS_PER_LINE = 42; // konservatif: lebih sedikit char/baris
                const LINE_HEIGHT_PX = 16; // lineHeight 1.4 * fontSize 10px + padding

                const chunkDynamic = (items: Lokasi[]): Lokasi[][] => {
                    const result: Lokasi[][] = [];
                    let current: Lokasi[] = [];
                    let usedHeight = 0;

                    for (const item of items) {
                        const lokasiText = Array.isArray(item.lokasi) ? item.lokasi.join(" • ") : item.lokasi;
                        const estimatedLines = Math.max(1, Math.ceil(lokasiText.length / CHARS_PER_LINE));
                        const lokasiHeight = Math.max(LOKASI_MIN_HEIGHT, estimatedLines * LINE_HEIGHT_PX + 8);
                        const itemHeight = HEADER_HEIGHT + lokasiHeight;

                        if (current.length > 0 && usedHeight + itemHeight > CANVAS_USABLE_HEIGHT) {
                            result.push(current);
                            current = [];
                            usedHeight = 0;
                        }
                        current.push(item);
                        usedHeight += itemHeight;
                    }
                    if (current.length > 0) result.push(current);
                    return result;
                };

                const chunk = chunkDynamic(dataLokasi);
                console.log("Dynamic chunks:", chunk);

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

#planetdenpasar #PLNBali #InfoPemadaman`;

                    setCaption(textCaption)

                }
                toast.closeAll();
            } else {
                toast.closeAll();
                showToast("Error", 1, "Google AI Error. Unable to generate AI caption.");
            }

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
                                    <div
                                        id={`canvas${idx}`}
                                        style={{
                                            position: "relative",
                                            width: 340,
                                            height: 425, // tinggi tetap = natural image ratio (1080x1350 @ width 340)
                                            backgroundImage: "url('/images/PLN-BACKGROUND.jpg')",
                                            backgroundSize: "100% 100%",
                                            backgroundRepeat: "no-repeat",
                                            overflow: "hidden", // konten tidak boleh melebihi batas canvas
                                        }}
                                    >
                                        {/* Konten mengalir secara normal (flow layout) */}
                                        <div style={{ position: "relative", zIndex: 1 }}>
                                            {/* Header tanggal — sama seperti sebelumnya, top 92 */}
                                            <Box
                                                style={{
                                                    position: "absolute",
                                                    top: 92,
                                                    left: 0,
                                                    width: "100%",
                                                    backgroundColor: "#14546d",
                                                    padding: "1px",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <Text color={"#fff"} className={poppins.className} fontSize={14}>{tanggal}</Text>
                                            </Box>

                                            {/* Spacer agar konten dimulai di bawah header tanggal */}
                                            <div style={{ paddingTop: 125 }}>
                                                <VStack align="flex-start" spacing={0} pb={4}>
                                                    {chunk.map?.((dt2, index) => {
                                                        const lokasi = Array.isArray(dt2.lokasi) ? dt2.lokasi.join(" • ") : dt2.lokasi;
                                                        return (
                                                            <React.Fragment key={index}>
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
                                                                    style={{
                                                                        borderWidth: 0.5,
                                                                        borderColor: "#0d2644",
                                                                    }}
                                                                    py={0.5}
                                                                    px={1}
                                                                    mx={4}
                                                                    w={310}
                                                                    minH={14}
                                                                    mb={1}
                                                                    color="#0d2644"
                                                                    justifyContent={"flex-start"}
                                                                    className={poppins.className}
                                                                    fontSize={9.5}
                                                                    fontWeight={500}
                                                                    whiteSpace="pre-line"
                                                                    lineHeight={1.3}
                                                                >
                                                                    {lokasi}
                                                                </Box>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </VStack>
                                            </div>
                                        </div>
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