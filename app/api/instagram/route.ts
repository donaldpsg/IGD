import { NextRequest, NextResponse } from "next/server";
import { launchBrowser } from "@/app/lib/puppeteer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const shortUrl = searchParams.get("url");

    if (!shortUrl) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let browser = null;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/123.0.0.0 Safari/537.36"
        );

        await page.goto(shortUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

        const finalUrl = page.url();
        const match = finalUrl.match(/\/reel\/([^/?]+)/);
        const code = match ? match[1] : null;

        return NextResponse.json({ code, fullUrl: finalUrl });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to resolve", detail: String(err) },
            { status: 500 }
        );
    } finally {
        if (browser) await browser.close().catch(() => { });
    }
}
