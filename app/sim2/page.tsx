"use client";
import React, { useState, useCallback } from "react";
import {
    FormControl,
    Input,
    Button,
    SimpleGrid,
    Box,
    Card,
    CardHeader,
    CardBody,
    Spacer,
    VStack,
    Image,
    StackDivider,
    IconButton,
    HStack,
    FormLabel,
    Textarea,
    Text,
    Flex
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { dateMySql } from "../config";
import { GoogleGenAI } from "@google/genai";
import { Poppins } from "next/font/google";
import * as htmlToImage from "html-to-image";

const poppins = Poppins({
    subsets: ["latin"], // sesuaikan subset yang diperlukan
    weight: ["400", "500", "600", "700"], // pilih weight yang kamu mau
});

type DataItem = {
    polres: string;
    lokasi: string;
    waktu: string;
};

type DataJadwal = {
    polres: string;
    lokasi: string[];
    waktu: string;
};

interface UrlSource {
    url: string;
    name: string;
    extension: string;
}

interface DataSource {
    urls: UrlSource[];
    meta: string; // atau bikin interface sendiri
    pictureUrl: string;
    pictureUrlWrapped: string;
}

export default function Page() {
    const router = useRouter();
    const toast = useToast();

    const [tanggal, setTanggal] = useState(dateMySql(new Date()));
    const [caption, setCaption] = useState("");


    const [jadwal, setJadwal] = useState<DataJadwal[][]>([]);
    const urlSource = "https://www.instagram.com/share/p/BAMqlRLBXU"

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

    const onChangeTanggal = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTanggal(e.target.value);
    }

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
            const apiRapid = "https://instagram120.p.rapidapi.com/api/instagram/links";
            const xRapidApiKey = "93b488f6f7msh4e6c6df286868e0p1bf4c6jsn7e78bf5fa74b";
            const xRapidApiHost = "instagram120.p.rapidapi.com";

            const response = await fetch(apiRapid, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-rapidapi-key": xRapidApiKey,
                    "x-rapidapi-host": xRapidApiHost,
                },
                body: JSON.stringify({
                    url: urlSource,
                }),
            });

            const dataSource: DataSource[] = await response.json();
            const links: string[] = dataSource.flatMap((item: DataSource) =>
                item.urls.map((u: UrlSource) => u.url)
            );

            const ai = new GoogleGenAI({ apiKey: "AIzaSyB0UfAHQyhCUay316B2nm_CTKrTra0aQSY" });
            const imageUrl1 = links.length > 0 ? `/api/proxy?url=${encodeURIComponent(links[0])}` : "/images/SIM1.jpg";
            const imageUrl2 = links.length > 1 ? `/api/proxy?url=${encodeURIComponent(links[1])}` : "/images/SIM2.jpg";

            const date = new Date(tanggal);
            const hari = days[date.getDay()];
            const tgl = date.getDate();

            const res1 = await fetch(imageUrl1);
            const imageArrayBuffer1 = await res1.arrayBuffer();
            const base64ImageData1 = Buffer.from(imageArrayBuffer1).toString('base64');

            const res2 = await fetch(imageUrl2);
            const imageArrayBuffer2 = await res2.arrayBuffer();
            const base64ImageData2 = Buffer.from(imageArrayBuffer2).toString('base64');

            const prompt = `Cari jadwal sim untuk hari ${hari} tanggal ${tgl} dari kedua gambar ini.Output data berupa JSON dengan key polres, lokasi dan waktu. Jika ada jadwal SENIN s/d SABTU itu artinya jadwal sim mencakup dari hari senin sampai sabtu. Output hanya JSON, tanpa kata pengantar atau penutup`

            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    // gambar pertama
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64ImageData1,
                        },
                    },
                    // gambar kedua
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64ImageData2,
                        },
                    },
                    { text: prompt }
                ],
            });

            let text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

            const data: DataItem[] = JSON.parse(text);
            const grouped = Object.values(
                data.reduce<Record<string, DataJadwal>>((acc, item) => {
                    if (!acc[item.polres]) {
                        acc[item.polres] = {
                            polres: item.polres,
                            lokasi: [item.lokasi],
                            waktu: item.waktu,
                        };
                    } else {
                        acc[item.polres].lokasi.push(item.lokasi);
                    }
                    return acc;
                }, {})
            );

            const sorted = [...grouped].sort((a, b) => a.polres.localeCompare(b.polres));
            const chunks = chunkArray(sorted, 4);
            setJadwal(chunks)

            const tglCaption = new Intl.DateTimeFormat("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }).format(
                new Date(tanggal)
            )
            const textCaption = `SIM Keliling Polda Bali ${tglCaption} menyediakan layanan perpanjangan SIM bagi warga Bali dengan persyaratan sebagai berikut :

                - Membawa E-KTP asli beserta fotocopy sebanyak 2 lembar.
                - Membawa SIM asli yang masih aktif masa berlakunya, dilengkapi dengan fotocopy 2 lembar.
                - Menyertakan surat keterangan sehat jasmani dan rohani (psikologi).

            Pastikan semua persyaratan dipenuhi sebelum mendatangi lokasi SIM Keliling untuk kelancaran proses perpanjangan SIM Anda.

            #planetdenpasar #planetkitabali  #infonetizenbali #infosemetonbali #simkelilingbali #simA #simC #bali`;

            setCaption(textCaption)
            toast.closeAll();
        } catch (e) {
            toast.closeAll();
            console.log(e);
            showToast("Error", 1, (e as Error).message);
        }

    }

    const tgl = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(new Date(tanggal))

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

    const createFileName = () => {
        // Generate a random string
        const randomString = Math.random().toString(36).substring(2, 10);

        // Get the current timestamp
        const timestamp = Date.now();

        // Construct the file name using the random string, timestamp, and extension
        const fileName = `pd_${randomString}_${timestamp}`;

        return fileName;
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
                                <FormLabel>Date</FormLabel>
                                <Input type="date" value={tanggal} onChange={(e) => onChangeTanggal(e)} />
                            </FormControl>
                            <Button onClick={submit} colorScheme="teal" size="sm" mt={4} ml={1}>
                                Get Data
                            </Button>
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
                            {jadwal.map((chunk, idx) => (
                                <div key={idx} style={{ marginTop: 40 }}>
                                    <div id={`canvas${idx}`} style={{ position: "relative", width: 340 }} >
                                        <Image src={"/images/SIM-BACKGROUND.jpg"} w={340} fit="cover" alt="media" />
                                        <Text style={{ position: "absolute", top: 92, right: 110 }} className={poppins.className} fontSize={12} fontWeight={600} color={"#d9812c"}>{tgl.toUpperCase()}</Text>

                                        {chunk.map?.((dt, index) => {
                                            const lokasi = Array.isArray(dt.lokasi) ? dt.lokasi.join("\n") : dt.lokasi;
                                            const posTop = (index * 55) + 130;
                                            return (
                                                <Flex key={index}>
                                                    <Box
                                                        style={{
                                                            position: "absolute",
                                                            left: 10,
                                                            top: posTop,
                                                            borderWidth: 0.5,
                                                            borderRadius: 5,
                                                            borderColor: "#0d2644"
                                                        }}
                                                        p={1}
                                                        w={85}
                                                        h={50}
                                                        bgGradient="linear(0deg, #0c2442, #4f7492)"
                                                        alignContent={"center"}
                                                    >
                                                        <Text fontSize={10.5} color={"white"} fontWeight={600} textAlign={"center"} lineHeight={1.3} className={poppins.className}>{dt.polres}</Text>
                                                    </Box>
                                                    <Box
                                                        style={{
                                                            position: "absolute",
                                                            left: 100,
                                                            top: posTop,
                                                            borderWidth: 0.5,
                                                            borderRadius: 5,
                                                            borderColor: "#0d2644",
                                                        }}
                                                        p={1}
                                                        w={230}
                                                        h={50}
                                                        alignContent={"center"}
                                                        className={poppins.className}
                                                        fontSize={10}
                                                        fontWeight={500}
                                                        lineHeight={dt.lokasi.length > 1 ? 1.3 : 1.5}
                                                        whiteSpace="pre-line" // 👈 supaya \n terbaca
                                                    >
                                                        {lokasi}
                                                        <Text fontWeight={700}>{dt.waktu}</Text> {/* 👈 tambahkan marginTop */}
                                                    </Box>
                                                </Flex>

                                            )
                                        })}
                                    </div>
                                    <Button colorScheme="teal" onClick={() => download(`canvas${idx}`, createFileName())} size="sm" mt={4}>
                                        Download
                                    </Button>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>
        </VStack >
    )
}