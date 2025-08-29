// /lib/puppeteer.ts
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function launchBrowser() {


    // return await puppeteer.launch({
    //     headless: true,
    //     executablePath:
    //         "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // sesuaikan path di lokal
    //     args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // });

    return await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true, // gunakan mode headless baru
    });
}
