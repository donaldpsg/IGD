"use client";
import React, { useState, useCallback } from "react";
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
    FormLabel,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { dateMySql } from "../config";
import { GoogleGenAI } from "@google/genai";

type DataItem = {
    polres: string;
    lokasi: string;
    waktu: string;
};

type ResultItem = {
    lokasi: string[];
    waktu: string;
};

export default function Page() {
    const router = useRouter();
    const toast = useToast();

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



    const onChangeTanggal = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTanggal(e.target.value);
    }

    const submit = async () => {
        toast({
            title: "Please wait",
            description: "Getting data...",
            status: "loading",
            duration: null,
        });

        try {
            const ai = new GoogleGenAI({ apiKey: "AIzaSyB0UfAHQyhCUay316B2nm_CTKrTra0aQSY" });
            const imageUrl1 = "/images/SIM1.jpg";
            const imageUrl2 = "/images/SIM2.jpg";

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
                data.reduce<Record<string, ResultItem>>((acc, item) => {
                    if (!acc[item.polres]) {
                        acc[item.polres] = {
                            lokasi: [item.lokasi],
                            waktu: item.waktu,
                        };
                    } else {
                        acc[item.polres].lokasi.push(item.lokasi);
                    }
                    return acc;
                }, {})
            );

            console.log(grouped);
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

                </SimpleGrid>
            </Box>
        </VStack>
    )
}