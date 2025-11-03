"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
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
    CardHeader,
    FormControl,
    FormLabel,
    Input
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import * as htmlToImage from "html-to-image";
import { Poppins } from "next/font/google";
import { dateMySql } from "../config";

const poppins = Poppins({
    subsets: ["latin"], // sesuaikan subset yang diperlukan
    weight: ["400", "500", "600", "700"], // pilih weight yang kamu mau
});

interface LokasiSamsat {
    kota: string;
    lokasi: string;
    jam: string;
}

export default function Page() {
    const router = useRouter();
    const toast = useToast();
    const [data, setData] = useState<LokasiSamsat[]>([]);
    const [imagesBase64, setImagesBase64] = useState<string[]>([]);
    const [caption, setCaption] = useState("");
    const [tanggal, setTanggal] = useState(dateMySql(new Date()));

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

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
        const fetchImages = async () => {
            const res = await fetch("/api/samsat");
            const data: string[] = await res.json();
            setImagesBase64(data); // langsung simpan array base64
        };

        fetchImages();
    }, []);


    const copy = async () => {
        try {
            await navigator.clipboard.writeText(caption ?? "");
            toast({
                title: "Success",
                description: `Copied to clipboard`,
                status: "success",
                duration: 9000,
                isClosable: true,
                position: "bottom-left",
            });
        } catch (e) {
            console.error("Failed to copy to clipboard:", e);
            toast({
                title: "Error",
                description: `Failed to copy to clipboard`,
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "bottom-left",
            });
        }
    };

    const onChangeTanggal = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTanggal(e.target.value);
    };

    const submit = async () => {
        toast({
            title: "Please wait",
            description: "Getting data...",
            status: "loading",
            duration: null,
        });

        try {
            const date = new Date(tanggal);
            const hari = days[date.getDay()];
            const tgl = new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            }).format(date);

            const prompt = `Cari jadwal samsat keliling kota Denpasar, Gianyar dan Tabanan untuk hari ${hari} tanggal ${tgl} dari kedua gambar ini. 
    Output data berupa JSON dengan key kota, lokasi dan jam.
    Kalau memang tidak ada jadwal samsat keliling pada salah satu kota, jangan dibuatkan data JSON nya.
    Output hanya JSON, tanpa kata pengantar atau penutup.`

            const responseAI = await fetch("/api/gemini/pln_stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imagesBase64, prompt }),
            });

            const dataAI = await responseAI.json();

            setData(JSON.parse(dataAI.text))

            const tgl_caption = new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }).format(new Date(tanggal))

            const text = `📢 Jadwal Samsat Keliling – ${tgl_caption}

Yuk, manfaatkan layanan cepat dan mudah tanpa harus ke kantor Samsat!
Jangan lupa bawa dokumen lengkap dan datang lebih awal ya!

#planetdenpasar #planetkitabali #infonetizenbali #infosemetonbali #SamsatKeliling #Bali #SamsatBali #PelayananPublik`;

            setCaption(text);


            toast.closeAll();
        } catch (e) {
            toast.closeAll();
            console.log(e);
            showToast("Error", 1, (e as Error).message);
        }
    }

    const tgl = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(new Date(tanggal))

    const createFileName = () => {
        // Generate a random string
        const randomString = Math.random().toString(36).substring(2, 10);

        // Get the current timestamp
        const timestamp = Date.now();

        // Construct the file name using the random string, timestamp, and extension
        const fileName = `samsat_${randomString}_${timestamp}`;

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
                        <CardHeader>
                            <Text fontWeight="semibold">SAMSAT KELILING</Text>
                        </CardHeader>
                        <CardBody>
                            <FormControl>
                                <FormLabel>Date</FormLabel>
                                <Input type="date" value={tanggal} onChange={(e) => onChangeTanggal(e)} />
                            </FormControl>
                            <Button onClick={submit} colorScheme="teal" size="sm" mt={4}>
                                Get Data
                            </Button>
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
                            <Button mt={4} onClick={copy} colorScheme="teal" size="sm" disabled={!caption} mb={4}>
                                Copy Caption
                            </Button>
                            <div id={`canvas-samsat`} style={{ position: "relative", width: 340 }} >
                                <Image src={"/images/SAMSAT-BACKGROUND.jpg"} w={340} fit="cover" alt="media" />
                                <Text style={{ position: "absolute", top: 78, color: "#443230", left: "50%", transform: "translateX(-50%)" }} className={poppins.className} fontSize={12} fontWeight={600} color={"#d9812c"}>{tgl.toUpperCase()}</Text>
                                {data.map?.((dt, index) => {
                                    const posTop = (index * 53) + 125;
                                    return (
                                        <VStack key={index}>
                                            <Box style={{
                                                position: "absolute",
                                                left: 30,
                                                top: posTop,
                                                borderWidth: 0.5,
                                                backgroundColor: "#fffaeb",
                                                width: "84%",
                                                padding: 5,
                                                textAlign: "center"
                                            }}>
                                                <Text fontWeight={500} fontSize={10} color="#443230" className={poppins.className}>{dt.lokasi}</Text>
                                            </Box>
                                            <Box
                                                style={{
                                                    position: "absolute", left: "50%", transform: "translateX(-50%)", top: posTop - 15, backgroundColor: "#443230", width: "50%", paddingLeft: 10, paddingTop: 2, paddingBottom: 2, borderRadius: 5
                                                }}>
                                                <Text fontWeight={500} fontSize={10} color="white" className={poppins.className}>{dt.kota} - {dt.jam}</Text>
                                            </Box>
                                        </VStack>

                                    )
                                })}
                            </div>
                            <Button colorScheme="teal" onClick={() => download(`canvas-samsat`, createFileName())} size="sm" mt={4}>
                                Download
                            </Button>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>
        </VStack>
    )
}