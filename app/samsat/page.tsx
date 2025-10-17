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
    Flex,
    Heading
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
// import * as htmlToImage from "html-to-image";
// import { Poppins } from "next/font/google";


// const poppins = Poppins({
//     subsets: ["latin"], // sesuaikan subset yang diperlukan
//     weight: ["400", "500", "600", "700"], // pilih weight yang kamu mau
// });

export default function Page() {
    const router = useRouter();
    const toast = useToast();
    //const [data, setData] = useState([]);
    const [imagesBase64, setImagesBase64] = useState<string[]>([]);
    const [caption, setCaption] = useState("");

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

    const fetchData = useCallback(async () => {
        showToast("Loading", 5, "Please wait...");

        try {

            const imgDenpasar = "/images/SAMSAT-DENPASAR.heic";
            const imgGianyar = "/images/SAMSAT-GIANYAR.jpg";

            const res1 = await fetch(imgDenpasar);
            const base64ImageData1 = Buffer.from(await res1.arrayBuffer()).toString("base64");

            const res2 = await fetch(imgGianyar);
            const base64ImageData2 = Buffer.from(await res2.arrayBuffer()).toString("base64");

            setImagesBase64([base64ImageData1, base64ImageData2]);
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        toast.closeAll();
    }, [showToast, toast]);

    useEffect(() => {
        fetchData(); // Panggil fungsi untuk memuat data
    }, [toast, fetchData]);

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
            const date = new Date();
            const hari = days[date.getDay()];
            const tgl = new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            }).format(date);

            const prompt = `Cari jadwal samsat keliling kota Denpasar dan Gianyar untuk hari ${hari} tanggal ${tgl} dari kedua gambar ini. 
    Output data berupa JSON dengan key kota, lokasi dan jam. 
    Output hanya JSON, tanpa kata pengantar atau penutup.`

            const responseAI = await fetch("/api/gemini/pln_stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imagesBase64, prompt }),
            });

            const dataAI = await responseAI.json();
            console.log(dataAI)
            //setData(JSON.parse(dataAI.text))


            toast.closeAll();
        } catch (e) {
            toast.closeAll();
            console.log(e);
            showToast("Error", 1, (e as Error).message);
        }
    }

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
                            <Flex>
                                <Text fontWeight="semibold">SAMSAT KELILING</Text>
                                <Spacer />
                                <Button onClick={submit} colorScheme="teal" size="sm" >
                                    Get Data
                                </Button>
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
                            <Button mt={4} onClick={copy} colorScheme="teal" size="sm" disabled={caption ? false : true} mb={4}>
                                Copy Caption
                            </Button>
                            <Heading as='h3' size='lg' color="red">UNDER CONSTRUCTION</Heading>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>
        </VStack>
    )
}