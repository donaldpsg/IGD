"use client";
import React, { useState, useEffect } from "react";
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
    Text,
    Flex,
    Textarea,
    CardHeader,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import * as htmlToImage from "html-to-image";
import { dateMySql } from "../config";

export default function Page() {
    const router = useRouter();
    const toast = useToast();

    const [json, setJson] = useState<any>();
    const [caption, setCaption] = useState("");
    const [tanggal, setTanggal] = useState(dateMySql(new Date()));

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch("/json/wc.json");
                const result = await response.json();
                setJson(result);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        fetchData();
    }, []);

    const onChangeTanggal = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTanggal(e.target.value);
    };

    const filter = () => {
        const data = json?.data?.filter((item: any) => item.date === tanggal);
        if (data.length === 0) {
            toast({
                title: "Error",
                description: `Tidak ada jadwal untuk tanggal ${tanggal}`,
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "bottom-left",
            });
            return;
        }

        const caption = data.map((item: any) => {
            return `${item.home} vs ${item.away} (${item.round})`;
        }).join("\n");

        setCaption(caption);
    };

    const createFileName = () => {
        const randomString = Math.random().toString(36).substring(2, 10);
        const timestamp = Date.now();
        const fileName = `wc_${randomString}_${timestamp}`;
        return fileName;
    };

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
                                <FormLabel>Date</FormLabel>
                                <Input type="date" value={tanggal} onChange={(e) => onChangeTanggal(e)} />
                            </FormControl>
                            <Button onClick={filter} colorScheme="teal" size="sm" mt={4} ml={1}>
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
                            <div style={{ marginTop: 40 }}>
                                <div style={{ position: "relative", width: 340 }} >
                                    <Image src={"/images/wc.jpg"} w={340} fit="cover" alt="media" />
                                    <Flex>
                                        <Box
                                            position="absolute"
                                            bottom={0}
                                            left={0}
                                            right={0}
                                            bg="#0a1128"
                                            borderRadius="md"
                                            overflow="hidden"
                                            maxW="320px"
                                            border="1px solid #1f2a44"
                                        >
                                            {/* Teams row */}
                                            <Flex justify="space-between" align="center" px={6} py={4}>
                                                <Flex align="center" gap={2}>
                                                    <Image src="/flags/brazil.png" alt="Brazil" boxSize="20px" borderRadius="full" />
                                                    <Text color="white" fontWeight="bold" fontSize="sm">BRAZIL</Text>
                                                </Flex>

                                                <Text color="gray.400" fontWeight="bold" fontSize="sm">V</Text>

                                                <Flex align="center" gap={2}>
                                                    <Text color="white" fontWeight="bold" fontSize="sm">MOROCCO</Text>
                                                    <Image src="/flags/morocco.png" alt="Morocco" boxSize="20px" borderRadius="full" />
                                                </Flex>
                                            </Flex>

                                            {/* Date/time bar */}
                                            <Box bg="white" py={2}>
                                                <Text textAlign="center" fontWeight="bold" fontSize="sm" color="black">
                                                    JUNE 13 • 6:00 PM ET
                                                </Text>
                                            </Box>
                                        </Box>
                                    </Flex>

                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>

        </VStack>

    );

}