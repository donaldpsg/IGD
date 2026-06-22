"use client";
import React, { useState, useCallback, useMemo, ChangeEvent } from "react";
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

// Letakkan di luar komponen
const CHARS_PER_LINE = 50;
const LINE_HEIGHT = 13;
const MIN_LOKASI_H = 32;
const HEADER_H = 24;
const START_TOP = 125;
const MAX_HEIGHT = 500;
const GAP = 5;

const estimateLines = (lokasi: string | string[]): number => {
    const text = Array.isArray(lokasi) ? lokasi.join(" • ") : lokasi;
    return Math.ceil(text.length / CHARS_PER_LINE);
};

const chunkByHeight = (arr: Lokasi[]): Lokasi[][] => {
    const chunks: Lokasi[][] = [];
    let currentChunk: Lokasi[] = [];
    let currentHeight = START_TOP;

    arr.forEach((item) => {
        const lines = estimateLines(item.lokasi);
        const itemHeight = HEADER_H + Math.max(MIN_LOKASI_H, lines * LINE_HEIGHT + 8) + GAP;

        if ((currentHeight + itemHeight > MAX_HEIGHT || currentChunk.length >= 3) && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [item];
            currentHeight = START_TOP + itemHeight;
        } else {
            currentChunk.push(item);
            currentHeight += itemHeight;
        }
    });

    if (currentChunk.length > 0) chunks.push(currentChunk);
    return chunks;
};

export default function Page() {
    const router = useRouter();
    const toast = useToast();
    const [caption, setCaption] = useState("");
    const [tanggal, setTanggal] = useState("");
    const [data, setData] = useState<Lokasi[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const [username, setUsername] = useState("plndistribusibali")

    // const [tanggal, setTanggal] = useState("Sabtu, 17 Mei 2025");

    // const [data, setData] = useState<Lokasi[]>([
    //     {
    //         ulp: "ULP DENPASAR SELATAN",
    //         waktu: "08:00 - 12:00",
    //         lokasi: ["Jl. Teuku Umar", "Jl. Diponegoro", "Jl. Gatot Subroto", "Jl. Mahendradatta", "Monang-Maning", "Permata Hijau",
    //         ],
    //     },
    //     {
    //         ulp: "ULP DENPASAR UTARA",
    //         waktu: "13:00 - 17:00",
    //         lokasi: ["Jl. Nusa Kambangan No. 11"],
    //     },
    //     {
    //         ulp: "ULP DENPASAR BARAT",
    //         waktu: "09:00 - 15:00",
    //         lokasi: ["Jl. Imam Bonjol", "Jl. Hasanudin", "Jl. Veteran"],
    //     },
    //     {
    //         ulp: "ULP BADUNG",
    //         waktu: "07:00 - 11:00",
    //         lokasi: ["Kuta", "Legian", "Seminyak", "Jl. Sunset Road", "Jl. Dewi Sri", "Jl. By Pass Ngurah Rai II",
    //             "Jl. Pulau Moyo", "Jl. Gringsing", "Jl. Siulan", "Jl. Gatsu Barat",
    //             "Puri Dalem Jimbaran", "Pantai Sari Dewi", "Jl. Pura Galuh", "Jl. Raya Kuta",
    //         ],
    //     },
    //     {
    //         ulp: "ULP MENGWI",
    //         waktu: "10:00 - 14:00",
    //         lokasi: ["Jl. Raya Mengwi No. 45"],
    //     },
    // ]);

    // Gunakan di render
    const chunkedData = useMemo(() => chunkByHeight(data), [data]);


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

                    Urutan lokasi_pemeliharaan: Urutkan berdasarkan ULP dengan prioritas berikut:
                    1. ULP Denpasar (mencakup area: Denpasar Kota, Sanur, Renon, Sesetan, Kerobokan, Ubung, Pemogan, Tonja, dan area Denpasar lainnya) — tampilkan paling awal
                    2. ULP Badung (mencakup area: Kuta, Legian, Seminyak, Nusa Dua, Jimbaran, Mengwi, Tuban, Kedonganan, dan area Badung lainnya) — setelah Denpasar
                    3. ULP kota/kabupaten lainnya (Gianyar, Tabanan, dll) — tampilkan paling akhir

                    Jika ragu suatu lokasi masuk ke ULP mana, lihat field "ulp" pada data, bukan nama lokasinya. Jika tidak ada yang cocok dengan "${hariIni}", kembalikan {}.`;

            const responseAI = await fetch("/api/gemini/pln_stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imagesBase64, prompt }),
            });

            const dataAI = await responseAI.json();

            if (!responseAI.ok) {
                toast.closeAll();

                let errorMessage = dataAI.error ?? "Google AI Error. Unable to generate AI caption.";

                // parse jika error masih berupa JSON string
                if (typeof errorMessage === "string") {
                    try {
                        const parsed = JSON.parse(errorMessage);
                        errorMessage = parsed.message ?? errorMessage;
                    } catch {
                        // biarkan errorMessage apa adanya
                    }
                } else if (typeof errorMessage === "object") {
                    errorMessage = errorMessage.message ?? JSON.stringify(errorMessage);
                }

                // pesan khusus berdasarkan status code
                if (responseAI.status === 503 || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE")) {
                    errorMessage = "Server AI sedang sibuk. Silakan coba beberapa saat lagi.";
                } else if (responseAI.status === 429) {
                    errorMessage = "Terlalu banyak permintaan. Silakan tunggu sebentar.";
                }

                showToast("Error", 1, errorMessage);
                return;
            }

            let dataJSON: DataPemeliharaan[] = JSON.parse(dataAI.text);

            if (!Array.isArray(dataJSON)) {
                dataJSON = [dataJSON];
            }

            const dataLokasi: Lokasi[] = dataJSON.flatMap(detail => detail.lokasi_pemeliharaan);
            setData(dataLokasi);
            console.log(dataLokasi);

            const lastEntry = dataJSON[dataJSON.length - 1];

            if (lastEntry) {
                setTanggal(lastEntry.tanggal_pemeliharaan);

                const textCaption = `⚡ PENGUMUMAN PEMADAMAN JARINGAN LISTRIK ⚡
                                Halo, Sobat PLN! 👋

                                PLN UP3 Bali akan melakukan pemeliharaan jaringan listrik pada:
                                📅 ${lastEntry.tanggal_pemeliharaan}

                                Sumber : @${username}

                                #planetdenpasar #PLNBali #InfoPemadaman`;

                setCaption(textCaption);
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

                            {chunkedData.map((chunk, idx) => (
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

                                        {chunk.map((dt, index) => {
                                            const lokasi = Array.isArray(dt.lokasi) ? dt.lokasi.join(" • ") : dt.lokasi;

                                            // Helper hitung estimasi jumlah baris teks
                                            const estimateLines = (lokasi: string | string[]): number => {
                                                const text = Array.isArray(lokasi) ? lokasi.join(" • ") : lokasi;
                                                const CHARS_PER_LINE = 50; // lebar box 294px / ~6px per karakter (fontSize 10)
                                                return Math.ceil(text.length / CHARS_PER_LINE);
                                            };

                                            const LINE_HEIGHT = 13;    // px per baris
                                            const MIN_LOKASI_H = 32;   // minH={8} = 32px
                                            const HEADER_H = 24;       // h={6} = 24px
                                            const START_TOP = 125;     // posisi mulai konten

                                            // Di dalam chunk.map:
                                            const posTop = chunk.slice(0, index).reduce((acc, prev) => {
                                                const lines = estimateLines(prev.lokasi);
                                                const lokasiHeight = Math.max(MIN_LOKASI_H, lines * LINE_HEIGHT + 8); // +8 untuk py={1}
                                                return acc + HEADER_H + lokasiHeight + 5;
                                            }, START_TOP);

                                            return (
                                                <VStack
                                                    key={index}
                                                    style={{
                                                        position: "absolute",
                                                        top: posTop,
                                                        left: 0,
                                                        right: 0,
                                                    }}
                                                    align="flex-start"
                                                    spacing={0}
                                                    px={4}
                                                >
                                                    <Box
                                                        bgColor="#14546d"
                                                        className={poppins.className}
                                                        fontSize={11}
                                                        fontWeight={600}
                                                        color="white"
                                                        p={1}
                                                        w={310}
                                                        h={6}
                                                        style={{
                                                            borderRightWidth: 0.5,
                                                            borderLeftWidth: 0.5,
                                                            borderColor: "#0d2644",
                                                        }}
                                                    >
                                                        <Flex justify="space-between" w="100%">
                                                            <Text>{dt.ulp}</Text>
                                                            <Text>{dt.waktu}</Text>
                                                        </Flex>
                                                    </Box>
                                                    <Box
                                                        style={{
                                                            borderWidth: 0.5,
                                                            borderColor: "#0d2644",
                                                        }}
                                                        textColor="#0d2644"
                                                        py={1}
                                                        px={1}
                                                        w={310}
                                                        minH={8}
                                                        className={poppins.className}
                                                        fontSize={10}
                                                        fontWeight={500}
                                                        whiteSpace="pre-wrap"
                                                        wordBreak="break-word"
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