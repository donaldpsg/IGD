// app/api/instagram/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { url } = await req.json();
    const parsedUrl = new URL(url);
    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    const username = parts[1] ?? null;
    const storyId = parts[2] && /^\d+$/.test(parts[2]) ? parts[2] : null;

    const response = await fetch("https://instagram120.p.rapidapi.com/api/instagram/story", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-rapidapi-key": process.env.RAPID_API_KEY!, // aman di server
            "x-rapidapi-host": "instagram120.p.rapidapi.com",
        },
        body: JSON.stringify({ username, storyId }),
    });

    const data = await response.json();
    return NextResponse.json(data);
}
