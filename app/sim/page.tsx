"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  InputGroup,
  InputRightElement,
  Icon,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import { FaArrowLeft, FaPaste } from "react-icons/fa";
import { useRouter } from "next/navigation";
import * as htmlToImage from "html-to-image";
import { dateMySql } from "../config";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"], // sesuaikan subset yang diperlukan
  weight: ["400", "500", "600", "700"], // pilih weight yang kamu mau
});

interface iDetail {
  tanggal: "string";
  lokasi: "string[]";
  waktu: "string";
}

interface iSIM {
  polresta_denpasar: Array<iDetail>;
  polres_badung: Array<iDetail>;
}

interface DataSIMDenpasar {
  lokasi: string[];
  waktu: string;
}

type DataJadwal = {
  polres: string;
  lokasi: string[];
  waktu: string;
};

export default function Page() {
  const router = useRouter();
  const toast = useToast();

  const [json, setJson] = useState<iSIM>();
  const [jadwal, setJadwal] = useState<DataJadwal[][]>([]);
  const [caption, setCaption] = useState("");
  const [tanggal, setTanggal] = useState(dateMySql(new Date()));
  const [urlDenpasar, setUrlDenpasar] = useState("");
  const [dataDenpasar, setDataDenpasar] = useState<DataSIMDenpasar | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Mengambil data dari file JSON yang ada di public
        const response = await fetch("/json/sim.json");
        const result = await response.json();
        setJson(result); // Menyimpan data JSON ke state
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData(); // Panggil fungsi untuk memuat data
  }, []);

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
    [toast],
  );

  const pasteDenpasar = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
        const text = await navigator.clipboard.readText();
        setUrlDenpasar(text);
      } else {
        showToast("Error", 1, "Clipboard API is not supported in this browser.");
      }
    } catch (e) {
      showToast("Error", 1, (e as Error).message);
    }
  };

  const submitDenpasar = async () => {
    toast({
      title: "Please wait",
      description: "Getting data...",
      status: "loading",
      duration: null,
    });

    try {
      const resIG = await fetch("/api/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlDenpasar }),
      });

      const dataIG = await resIG.json();
      const imageUrl = `/api/proxy?url=${encodeURIComponent(dataIG[0].pictureUrl)}`;

      const resImage = await fetch(imageUrl);
      const base64ImageData = Buffer.from(await resImage.arrayBuffer()).toString("base64");

      const prompt = `Deteksi jadwal SIM Keliling Polresta Denpasar pada gambar. Sajikan output hanya dalam format JSON tanpa kata pengantar dan penutup. Key pada object terdiri dari lokasi dan waktu. Format lokasi adalah array string berisi daftar lokasi. Format waktu adalah string.`;

      const responseAI = await fetch("/api/gemini/pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64ImageData, prompt }),
      });

      if (responseAI.ok) {
        const dataAI = await responseAI.json();
        const dataJSON: DataSIMDenpasar = JSON.parse(dataAI.text);
        setDataDenpasar(dataJSON);
        toast.closeAll();
      } else {
        toast.closeAll();
        showToast("Error", 1, "Google AI Error.");
      }
    } catch (e) {
      toast.closeAll();
      showToast("Error", 1, (e as Error).message);
    }
  };

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr); // Mengonversi string ke objek Date

    // Format tanggal sesuai dengan lokal Indonesia
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    // Format tanggal menggunakan Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat("id-ID", options);
    return formatter.format(date);
  }

  function formatString(input: string): string {
    return input
      .replace(/_/g, " ") // Ganti underscore (_) dengan spasi
      .toUpperCase(); // Ubah semua karakter menjadi huruf besar
  }

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

  const filter = () => {
    const data: Array<DataJadwal> = [];
    const dtFormat = formatDate(tanggal);

    // Data dari JSON (polres selain Denpasar)
    for (const key in json) {
      const array = json[key as keyof iSIM];
      const filtered = array.filter((item) => item.tanggal === dtFormat);

      if (filtered.length > 0) {
        const arrLokasi: string[] = Array.isArray(filtered[0].lokasi) ? filtered[0].lokasi : [filtered[0].lokasi];
        data.push({
          polres: formatString(key),
          lokasi: arrLokasi,
          waktu: filtered[0].waktu,
        });
      }
    }

    // Tambahkan data Polresta Denpasar dari AI jika ada
    if (dataDenpasar) {
      data.unshift({
        polres: "POLRESTA DENPASAR",
        lokasi: dataDenpasar.lokasi,
        waktu: dataDenpasar.waktu,
      });
    }

    const chunks = chunkArray(data, 4);

    const text = `📢 Layanan SIM Keliling Polda Bali – ${dtFormat}\n\nPerpanjang SIM A & C dengan mudah melalui layanan SIM Keliling Polda Bali.\n\nSyarat yang harus dibawa:\n✅ E‑KTP asli + 2 lembar fotokopi\n✅ SIM asli yang masih berlaku + 2 lembar fotokopi\n✅ Surat keterangan sehat jasmani & rohani (psikologi)\n\nPastikan semua dokumen lengkap sebelum datang agar proses perpanjangan berjalan cepat dan lancar. 🚗🏍️\n\n#planetdenpasar #infonetizenbali #simkelilingbali`;

    setCaption(text);
    setJadwal(chunks);
  };

  const createFileName = () => {
    // Generate a random string
    const randomString = Math.random().toString(36).substring(2, 10);

    // Get the current timestamp
    const timestamp = Date.now();

    // Construct the file name using the random string, timestamp, and extension
    const fileName = `sim_${randomString}_${timestamp}`;

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

  const tgl = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(tanggal));

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
              <FormControl mt={4}>
                <FormLabel>URL Post SIM Polresta Denpasar</FormLabel>
                <InputGroup>
                  <Input
                    type="text"
                    value={urlDenpasar}
                    onChange={(e) => setUrlDenpasar(e.target.value)}
                    placeholder="Paste URL Instagram Post"
                  />
                  <InputRightElement>
                    <Button onClick={pasteDenpasar}>
                      <Icon as={FaPaste} color="#493628" />
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <Button onClick={submitDenpasar} colorScheme="blue" size="sm" mt={2} isDisabled={!urlDenpasar}>
                  Get Data Denpasar 🔍
                </Button>
                {dataDenpasar && (
                  <Box mt={2} p={2} bg="green.50" borderRadius="md" fontSize="sm">
                    <Text fontWeight={600} color="green.700">
                      ✅ Data Denpasar berhasil diambil
                    </Text>
                    <Text>{dataDenpasar.lokasi.join(", ")}</Text>
                    <Text>{dataDenpasar.waktu}</Text>
                  </Box>
                )}
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
              {jadwal.map((chunk, idx) => (
                <div key={idx} style={{ marginTop: 40 }}>
                  <div id={`canvas${idx}`} style={{ position: "relative", width: 340 }}>
                    <Image src={"/images/SIM-BACKGROUND.jpg"} w={340} fit="cover" alt="media" />
                    <Text
                      style={{ position: "absolute", top: 92, right: 110 }}
                      className={poppins.className}
                      fontSize={11}
                      fontWeight={600}
                      color={"#d9812c"}
                    >
                      {tgl.toUpperCase()}
                    </Text>

                    {chunk.map?.((dt, index) => {
                      const lokasi = Array.isArray(dt.lokasi) ? dt.lokasi.join("\n") : dt.lokasi;
                      const posTop = index * 50 + 140;
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
                            h={45}
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
                            h={45}
                            alignContent={"center"}
                            className={poppins.className}
                            fontSize={9.5}
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
