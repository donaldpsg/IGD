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

// Tambahkan interface ini di atas component
interface Match {
  id: number;
  home: string;
  away: string;
  date: string;
  time: string;
  group: string | null;
  round: string;
  venue: string;
  played: boolean;
  status: string;
  score: string | null;
  minute: number;
  live_data: null;
}

interface MatchDay {
  date: string;
  matches: Match[];
}

interface WCData {
  data: MatchDay[];
  match_days: number;
  status: string;
}

export default function Page() {
  const router = useRouter();
  const toast = useToast();

  const [json, setJson] = useState<WCData | undefined>();
  const [caption, setCaption] = useState("");
  const [tanggal, setTanggal] = useState(dateMySql(new Date()));

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/json/wc.json");
        const result: WCData = await response.json();
        setJson(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, []);

  const onChangeTanggal = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTanggal(e.target.value);
    setCaption("");
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

  const matchesOfDay: Match[] = json?.data?.find((d: MatchDay) => d.date === tanggal)?.matches ?? [];

  const countryCodeMap: Record<string, string> = {
    // Amerika
    USA: "us",
    Canada: "ca",
    Mexico: "mx",
    Brazil: "br",
    Argentina: "ar",
    Colombia: "co",
    Ecuador: "ec",
    Uruguay: "uy",
    Paraguay: "py",
    Panama: "pa",
    Haiti: "ht",
    Curaçao: "cw",

    // Eropa
    England: "gb-eng",
    Scotland: "gb-sct",
    France: "fr",
    Germany: "de",
    Spain: "es",
    Portugal: "pt",
    Netherlands: "nl",
    Belgium: "be",
    Croatia: "hr",
    Switzerland: "ch",
    Austria: "at",
    Norway: "no",
    Sweden: "se",
    Turkey: "tr",
    "Czech Republic": "cz",
    "Bosnia & Herzegovina": "ba",

    // Asia
    Japan: "jp",
    "South Korea": "kr",
    Iran: "ir",
    "Saudi Arabia": "sa",
    Qatar: "qa",
    Iraq: "iq",
    Jordan: "jo",
    Uzbekistan: "uz",
    Australia: "au",
    "New Zealand": "nz",

    // Afrika
    Morocco: "ma",
    Egypt: "eg",
    Senegal: "sn",
    Ghana: "gh",
    Tunisia: "tn",
    Algeria: "dz",
    "South Africa": "za",
    "Ivory Coast": "ci",
    "Cape Verde": "cv",
    "DR Congo": "cd",
  };

  function getFlagUrl(countryName: string): string {
    const code = countryCodeMap[countryName];
    if (!code) return ""; // placeholder untuk kode wildcard seperti W73, 1A, dll
    return `https://flagcdn.com/w40/${code}.png`;
  }

  function getTeamFontSize(name: string): string {
    if (name.length > 12) return "9px";
    if (name.length > 8) return "10px";
    return "12px"; // default sm
  }

  function generateCaptionLocal(): string {
    if (matchesOfDay.length === 0) return "";

    const matchList = matchesOfDay
      .map((match: Match) => {
        return `⚽ ${match.home} vs ${match.away} pukul ${match.time}`;
      })
      .join("\n");

    const firstMatch = matchesOfDay[0];
    const [year, month, day] = firstMatch.date.split("-").map(Number);
    const dateLabel = new Date(year, month - 1, day)
      .toLocaleDateString("id-ID", { month: "long", day: "numeric" })
      .toUpperCase();

    return `🏆 Jadwal FIFA World Cup 2026 - ${dateLabel}!\n\nJangan sampai ketinggalan pertandingan seru! 🔥\n\n${matchList}\n\nNonton bareng yuk! 📺🎉\n\n#planetdenpasar #fifaworldcup2026 #worldcup2026`;
  }

  // Helper function - taruh di luar component
  function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
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
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <Flex gap={2}>
                <Button
                  flex={1}
                  colorScheme="blue"
                  onClick={() => setCaption(generateCaptionLocal())}
                  isDisabled={matchesOfDay.length === 0}
                >
                  Generate Caption IG ✨
                </Button>
                <Button colorScheme="teal" size="md" isDisabled={!caption} onClick={copy}>
                  Copy 📋
                </Button>
              </Flex>
            </CardHeader>

            <CardBody>
              <Textarea
                value={caption}
                style={{ whiteSpace: "pre-wrap" }}
                size="sm"
                mb={4}
                rows={13}
                onChange={(e) => {
                  setCaption(e.target.value);
                }}
              />

              {chunkArray(matchesOfDay, 4).map((chunk, index) => (
                <div key={index} style={{ marginTop: 40 }}>
                  <div id={`canvas_${index}`} style={{ position: "relative", width: 340 }}>
                    <Image src={"/images/wc.jpg"} w={340} fit="cover" alt="media" />

                    <Box
                      position="absolute"
                      top="100px"
                      bottom={chunk.length <= 2 ? "120px" : undefined}
                      left={0}
                      right={0}
                      mx="auto"
                      maxW="320px"
                      display="flex"
                      flexDirection="column"
                      justifyContent={chunk.length <= 2 ? "center" : "flex-start"}
                      gap={2}
                    >
                      {chunk.map((match: Match) => (
                        <Box key={match.id} bg="#0a1128" borderRadius="md" overflow="hidden" border="1px solid #1f2a44">
                          {/* Teams row */}
                          <Flex justify="space-between" align="center" px={4} py={2}>
                            <Flex align="center" gap={2}>
                              <Image src={getFlagUrl(match.home)} alt={match.home} boxSize="20px" borderRadius="full" />
                              <Text
                                color="white"
                                fontFamily="var(--font-fwc2026), sans-serif"
                                fontSize={getTeamFontSize(match.home)}
                                whiteSpace="nowrap"
                              >
                                {match.home.toUpperCase()}
                              </Text>
                            </Flex>

                            <Text color="gray.400" fontWeight="bold" fontSize="sm">
                              VS
                            </Text>

                            <Flex align="center" gap={2}>
                              <Text
                                color="white"
                                fontFamily="var(--font-fwc2026), sans-serif"
                                fontSize={getTeamFontSize(match.away)}
                                whiteSpace="nowrap"
                              >
                                {match.away.toUpperCase()}
                              </Text>
                              <Image src={getFlagUrl(match.away)} alt={match.home} boxSize="20px" borderRadius="full" />
                            </Flex>
                          </Flex>

                          <Box bg="white" py={1}>
                            <Text
                              textAlign="center"
                              fontFamily="var(--font-fwc2026), sans-serif"
                              fontSize="12"
                              color="black"
                            >
                              {(() => {
                                const [year, month, day] = match.date.split("-").map(Number);
                                const dateLabel = new Date(year, month - 1, day)
                                  .toLocaleDateString("id-ID", { month: "long", day: "numeric" })
                                  .toUpperCase();
                                return `${dateLabel} • ${match.time}`;
                              })()}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </div>

                  <Button
                    colorScheme="teal"
                    onClick={() => download(`canvas_${index}`, `${createFileName()}_part${index + 1}`)}
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
