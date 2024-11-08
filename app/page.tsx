"use client";
import { Center, VStack, Button, Image, Box, SimpleGrid } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <Center height="50vh">
      <VStack>
        <Image src="/images/logo-pd.png" alt="logo" h={128} />
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
                router.push(`/twitter`);
              }}
            >
              X VIDEO
            </Button>
          </SimpleGrid>
          <SimpleGrid columns={2} spacing={2} mt={2}>

            <Button
              colorScheme="teal"
              onClick={() => {
                router.push(`/video`);
              }}
            >
              IG VIDEO
            </Button>
          </SimpleGrid>
        </Box>
      </VStack>
    </Center>
  );
}
