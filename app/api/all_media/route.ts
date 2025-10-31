// app/api/instagram/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const formData = await req.formData();
    const url = formData.get("url") as string;
    const params = new URLSearchParams({ url });

    const response = await fetch("https://all-media-downloader1.p.rapidapi.com/all", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-rapidapi-key": process.env.RAPID_API_KEY!, // aman di server
            "x-rapidapi-host": "all-media-downloader1.p.rapidapi.com",
        },
        body: params.toString(),
    });

    const data = await response.json();
    return NextResponse.json(data);
}
