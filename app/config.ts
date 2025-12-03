export const dimensiAlfabet = [
    { huruf: "A", panjang: 13.92 }, { huruf: "a", panjang: 11.14 },
    { huruf: "B", panjang: 16.71 }, { huruf: "b", panjang: 13.92 },
    { huruf: "C", panjang: 15.32 }, { huruf: "c", panjang: 12.53 },
    { huruf: "D", panjang: 18.1 }, { huruf: "d", panjang: 15.32 },
    { huruf: "E", panjang: 13.92 }, { huruf: "e", panjang: 11.14 },
    { huruf: "F", panjang: 15.32 }, { huruf: "f", panjang: 12.53 },
    { huruf: "G", panjang: 16.71 }, { huruf: "g", panjang: 13.92 },
    { huruf: "H", panjang: 20.89 }, { huruf: "h", panjang: 18.1 },
    { huruf: "I", panjang: 6.96 }, { huruf: "i", panjang: 5.57 },
    { huruf: "J", panjang: 13.92 }, { huruf: "j", panjang: 11.14 },
    { huruf: "K", panjang: 18.1 }, { huruf: "k", panjang: 15.32 },
    { huruf: "L", panjang: 13.92 }, { huruf: "l", panjang: 11.14 },
    { huruf: "M", panjang: 20.89 }, { huruf: "m", panjang: 18.1 },
    { huruf: "N", panjang: 19.49 }, { huruf: "n", panjang: 16.71 },
    { huruf: "O", panjang: 15.32 }, { huruf: "o", panjang: 12.53 },
    { huruf: "P", panjang: 16.71 }, { huruf: "p", panjang: 13.92 },
    { huruf: "Q", panjang: 15.32 }, { huruf: "q", panjang: 12.53 },
    { huruf: "R", panjang: 16.71 }, { huruf: "r", panjang: 13.92 },
    { huruf: "S", panjang: 13.92 }, { huruf: "s", panjang: 11.14 },
    { huruf: "T", panjang: 15.32 }, { huruf: "t", panjang: 12.53 },
    { huruf: "U", panjang: 16.71 }, { huruf: "u", panjang: 13.92 },
    { huruf: "V", panjang: 18.1 }, { huruf: "v", panjang: 15.32 },
    { huruf: "W", panjang: 22.28 }, { huruf: "w", panjang: 19.49 },
    { huruf: "X", panjang: 19.49 }, { huruf: "x", panjang: 16.71 },
    { huruf: "Y", panjang: 16.71 }, { huruf: "y", panjang: 13.92 },
    { huruf: "Z", panjang: 15.32 }, { huruf: "z", panjang: 12.53 },
    { huruf: " ", panjang: 6.96 } // Spasi
];

export const words: string[] = [
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog",
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur",
    "adipiscing", "elit", "sed", "do", "eiusmod", "tempor",
    "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua",
    "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
    "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip",
    "ex", "ea", "commodo", "consequat", "duis", "aute", "irure",
    "dolor", "in", "reprehenderit", "in", "voluptate", "velit",
    "esse", "cillum", "dolore", "eu", "fugiat", "nulla", "pariatur",
    "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
    "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit",
    "anim", "id", "est", "laborum"
];


export const getInstagramShortcode = (url: string) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([A-Za-z0-9-_]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
        return match[1];
    } else {
        return null; // Return null if no shortcode is found
    }
};

export const hashtag = ["#PlanetDenpasar", "#InfoNetizenBali"];

export function getVideoResolution(url: string): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = url;

        // Tunggu sampai metadata video (termasuk resolusi) tersedia
        video.onloadedmetadata = () => {
            resolve({ width: video.videoWidth, height: video.videoHeight });
        };

        video.onerror = (error) => {
            reject('Gagal memuat video: ' + error);
        };
    });

}

export function capitalizeWords(title: string): string {
    const text =
        title.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

    return text
}

export function dateMySql(date: Date) {
    const dtDate = new Date(date);
    const dtShort = dtDate.toLocaleDateString('en-GB', { dateStyle: "short" })
    const arrDt = dtShort.split("/")

    return `${arrDt[2]}-${arrDt[1]}-${arrDt[0]}`
}

export const createFileName = () => {
    // Generate a random string
    const randomString = Math.random().toString(36).substring(2, 10);

    // Get the current timestamp
    const timestamp = Date.now();

    // Construct the file name using the random string, timestamp, and extension
    const fileName = `pd_${randomString}_${timestamp}`;

    return fileName;
};

