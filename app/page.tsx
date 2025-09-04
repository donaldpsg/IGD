"use client";
import { Center, VStack, Button, Image, Box, SimpleGrid } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { DownloadIcon } from "@chakra-ui/icons";

export default function Page() {
  const router = useRouter();

  return (
    <Center height="50vh">
      <VStack>
        <Image src="/images/logo-pd.png" alt="logo" h={128} />
        <Box mt={10} borderWidth={2} borderRadius={10} p={4}>
          <SimpleGrid columns={3} spacing={2}>
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
            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/sim`);
              }}
            >
              SIM KELILING
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
      </VStack>
    </Center>
  );
}
