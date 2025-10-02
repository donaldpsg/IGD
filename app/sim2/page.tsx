"use client";
import React, { useState, useCallback, useEffect, ChangeEvent } from "react";
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
  Flex,
  InputGroup,
  InputRightElement,
  Icon,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaPaste } from "react-icons/fa";
import { dateMySql } from "../config";
import { Poppins } from "next/font/google";
import * as htmlToImage from "html-to-image";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

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
  const [urlSource, setUrlSource] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [jadwal, setJadwal] = useState<DataJadwal[][]>([]);

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
      const resGit = await fetch("/api/github", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const dataGit = await resGit.json();

      const response = await fetch("/api/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: dataGit.content }),
      });

      const dataSource: DataSource[] = await response.json();

      const links: string[] = dataSource.flatMap((item: DataSource) => item.urls.map((u: UrlSource) => u.url));

      const imageUrl1 = links.length > 0 ? `/api/proxy?url=${encodeURIComponent(links[0])}` : "/images/SIM1.jpg";
      const imageUrl2 = links.length > 1 ? `/api/proxy?url=${encodeURIComponent(links[1])}` : "/images/SIM2.jpg";

      setUrlSource(dataGit.content);
      setImages([imageUrl1, imageUrl2]);
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

  const onChangeTanggal = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTanggal(e.target.value);
  };

  function chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  const saveDataSource = async () => {
    toast({
      title: "Please wait",
      description: "Saving data...",
      status: "loading",
      duration: null,
    });

    try {
      await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: urlSource }),
      });

      toast.closeAll();
      await fetchData();
    } catch (e) {
      toast.closeAll();
      console.log(e);
      showToast("Error", 1, (e as Error).message);
    }
  };

  const submit = async () => {
    toast({
      title: "Please wait",
      description: "Getting data...",
      status: "loading",
      duration: null,
    });

    try {
      const res1 = await fetch(images[0]);
      const base64ImageData1 = Buffer.from(await res1.arrayBuffer()).toString("base64");

      const res2 = await fetch(images[1]);
      const base64ImageData2 = Buffer.from(await res2.arrayBuffer()).toString("base64");

      const date = new Date(tanggal);
      const hari = days[date.getDay()];
      const tgl = date.getDate();

      const responseAI = await fetch("/api/gemini/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64ImageData1, base64ImageData2, hari, tgl }),
      });

      const dataAI = await responseAI.json();

      console.log(dataAI);

      const data: DataItem[] = JSON.parse(dataAI.text);
      console.log(data);
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
      setJadwal(chunks);

      const tglCaption = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(tanggal));
      const textCaption = `SIM Keliling Polda Bali ${tglCaption} menyediakan layanan perpanjangan SIM bagi warga Bali dengan persyaratan sebagai berikut :\n
            - Membawa E-KTP asli beserta fotocopy sebanyak 2 lembar.\n
            - Membawa SIM asli yang masih aktif masa berlakunya, dilengkapi dengan fotocopy 2 lembar.\n
            - Menyertakan surat keterangan sehat jasmani dan rohani (psikologi).\n\n
            Pastikan semua persyaratan dipenuhi sebelum mendatangi lokasi SIM Keliling untuk kelancaran proses perpanjangan SIM Anda.\n\n
            #planetdenpasar #planetkitabali  #infonetizenbali #infosemetonbali #simkelilingbali #simA #simC #bali`;

      setCaption(textCaption);
      toast.closeAll();
    } catch (e) {
      toast.closeAll();
      console.log(e);
      showToast("Error", 1, (e as Error).message);
    }
  };

  const tgl = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(tanggal));

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

  const paste = async () => {
    try {
      // Check if the browser supports the Clipboard API
      if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
        // Use the Clipboard API to read text from the clipboard
        const text = await navigator.clipboard.readText();
        setUrlSource(text);
      } else {
        showToast("Error", 1, "Clipboard API is not supported in this browser.");
      }
    } catch (e) {
      showToast("Error", 1, (e as Error).message);
    }
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
                <FormLabel>DataSource URL</FormLabel>
                <InputGroup>
                  <Input
                    type="text"
                    value={urlSource}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUrlSource(e.target.value)}
                    placeholder="Paste URL Instagram"
                  />
                  <InputRightElement>
                    <Button onClick={paste}>
                      <Icon as={FaPaste} color="#493628" />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Box position="relative" w={325} h={406} mt={3} overflow="hidden">
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
              <Button onClick={saveDataSource} colorScheme="teal" size="sm" mt={4} ml={1}>
                Update DataSource
              </Button>
            </CardBody>
          </Card>
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
                  <div id={`canvas${idx}`} style={{ position: "relative", width: 340 }}>
                    <Image src={"/images/SIM-BACKGROUND.jpg"} w={340} fit="cover" alt="media" />
                    <Text
                      style={{ position: "absolute", top: 92, right: 110 }}
                      className={poppins.className}
                      fontSize={12}
                      fontWeight={600}
                      color={"#d9812c"}
                    >
                      {tgl.toUpperCase()}
                    </Text>

                    {chunk.map?.((dt, index) => {
                      const lokasi = Array.isArray(dt.lokasi) ? dt.lokasi.join("\n") : dt.lokasi;
                      const posTop = index * 55 + 130;
                      return (
                        <Flex key={index}>
                          <Box
                            style={{
                              position: "absolute",
                              left: 10,
                              top: posTop,
                              borderWidth: 0.5,
                              borderRadius: 5,
                              borderColor: "#0d2644",
                            }}
                            p={1}
                            w={85}
                            h={50}
                            bgGradient="linear(0deg, #0c2442, #4f7492)"
                            alignContent={"center"}
                          >
                            <Text
                              fontSize={10.5}
                              color={"white"}
                              fontWeight={600}
                              textAlign={"center"}
                              lineHeight={1.3}
                              className={poppins.className}
                            >
                              {dt.polres}
                            </Text>
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
  );
}
