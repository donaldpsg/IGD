import puppeteer from "puppeteer-core";

export async function launchBrowser() {
    return await puppeteer.launch({
        headless: true,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // sesuaikan
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
}
