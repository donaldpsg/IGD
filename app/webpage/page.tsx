"use client";
import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { FaPaste, FaDownload, FaArrowLeft, FaCopy } from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
    FormControl,
    Input,
    InputGroup,
    InputRightElement,
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
    Textarea,
    CardHeader,
    Text
} from "@chakra-ui/react";
import { Icon, useToast } from "@chakra-ui/react";
import { hashtag } from "../config";

export default function Page() {
    const router = useRouter();
    const toast = useToast();

    const [url, setUrl] = useState("");
    const [caption, setCaption] = useState("");

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
        showToast("Success", 0, "Copied to cliboard");
    };


    const paste = async () => {
        try {
            // Check if the browser supports the Clipboard API
            if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
                // Use the Clipboard API to read text from the clipboard
                const text = await navigator.clipboard.readText();
                setUrl(text);
            } else {
                showToast("Error", 1, "Clipboard API is not supported in this browser.");
            }
        } catch (e) {
            showToast("Error", 1, (e as Error).message);
        }
    };

    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        toast({
            title: "Please wait",
            description: "Preparing media and thumbnail...",
            status: "loading",
            duration: null,
        });

        try {

            const prompt = `Tulis ulang berita dari halaman berikut ${url} sebagai caption Instagram yang mudah dicerna namun tetap formal. 
            Lengkapi juga dengan hashtag populer yang terkait dengan berita. 
            Carikan juga gambar yang relevan untuk berita tersebut.
            Gunakan bahasa Indonesia yang mudah dipahami.
            Jadi outputnya harus berupa JSON dengan key caption dan url_gambar tanpa kata pengantar atau penutup.`

            const resPrompt = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });
            const data = await resPrompt.json();

            let jsonText = data.text;

            // 2️⃣ Hapus tanda ```json dan ``` di awal/akhir jika ada
            jsonText = jsonText.replace(/```json|```/g, '').trim();

            const parsed = JSON.parse(jsonText);

            setCaption(`${parsed.caption}\n${hashtag.join(" ")}`)

            toast.closeAll()

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
                            <Text fontWeight="semibold">URL WEBPAGE</Text>
                        </CardHeader>
                        <CardBody>
                            <form onSubmit={(e: FormEvent<HTMLFormElement>) => submit(e)}>
                                <FormControl>
                                    <InputGroup>
                                        <Input
                                            type="text"
                                            value={url}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                                            placeholder="Paste URL"
                                        />
                                        <InputRightElement>
                                            <Button onClick={paste}>
                                                <Icon as={FaPaste} color="#493628" />
                                            </Button>
                                        </InputRightElement>
                                    </InputGroup>
                                    <Button type="submit" leftIcon={<FaDownload />} colorScheme="teal" size="sm" mt={4} width="100%">
                                        GET DATA
                                    </Button>
                                </FormControl>
                            </form>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>

                            <Textarea
                                value={caption}
                                style={{ whiteSpace: "pre-wrap" }}
                                size="sm"
                                my={2}
                                rows={caption ? 20 : 3}
                                onChange={(e) => {
                                    setCaption(e.target.value);
                                }}
                            />

                            <Button leftIcon={<FaCopy />} onClick={copy} ml={2} colorScheme="teal" size="sm" disabled={caption ? false : true}>
                                AI Caption
                            </Button>
                        </CardBody>
                    </Card>
                </SimpleGrid>

            </Box>
        </VStack>
    )
}