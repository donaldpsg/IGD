// app/api/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const shortUrl = searchParams.get("url");

    if (!shortUrl) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.goto(shortUrl, { waitUntil: "networkidle2" });

        // Setelah redirect, url() sudah berubah ke URL final
        const finalUrl = page.url();
        await browser.close();

        let code: string | null = null;
        const match = finalUrl.match(/\/reel\/([^/?]+)/);
        if (match) code = match[1];

        return NextResponse.json({ code, fullUrl: finalUrl });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to resolve", detail: String(err) },
            { status: 500 }
        );
    }
}
