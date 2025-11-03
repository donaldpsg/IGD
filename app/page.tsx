"use client";
import { Center, VStack, Button, Image, Box, SimpleGrid, Text, Link } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { DownloadIcon } from "@chakra-ui/icons";

export default function Page() {
  const router = useRouter();

  return (
    <Center height="50vh">
      <VStack>
        <Image src="/images/logo-pd.png" alt="logo" h={128} style={{ marginTop: 100 }} />
        <Box mt={10} borderWidth={2} borderRadius={10} p={4}>
          <SimpleGrid columns={2} spacing={2}>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/download`);
              }}
            >
              IG POST
            </Button>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/video`);
              }}
            >
              IG VIDEO
            </Button>

          </SimpleGrid>
          <SimpleGrid columns={2} spacing={2} mt={2}>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/sim`);
              }}
            >
              SIM KELILING
            </Button>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/webpage`);
              }}
            >
              WEBPAGE
            </Button>
          </SimpleGrid>
          <SimpleGrid columns={2} spacing={2} mt={2}>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/pln`);
              }}
            >
              PLN (Story)
            </Button>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/pln_stories`);
              }}
            >
              PLN (Stories)
            </Button>
          </SimpleGrid>
          <SimpleGrid columns={2} spacing={2} mt={2}>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/pdam`);
              }}
            >
              GANGGUAN AIR
            </Button>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/samsat`);
              }}
            >
              SAMSAT KELILING
            </Button>
          </SimpleGrid>
          <SimpleGrid columns={2} spacing={2} mt={2}>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/all_media`);
              }}
            >
              X VIDEO
            </Button>
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/twitter_image`);
              }}
            >
              X IMAGE
            </Button>
          </SimpleGrid>
          <SimpleGrid columns={1} spacing={2} mt={2}>

            <a href="/images/slide-pd.jpg" download="slide.jpg">
              <Button
                colorScheme="teal"
                width="100%"
                leftIcon={<DownloadIcon />}
              >
                SLIDE PLANET DENPASAR
              </Button>
            </a>
          </SimpleGrid>
        </Box>
        <Text>
          Copyright by{" "}
          <Link href="mailto:donald.siregar@live.com" color="blue.400">
            Donald Siregar
          </Link>
        </Text>
      </VStack>
    </Center>
  );
}
