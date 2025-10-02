// app/api/instagram/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { url } = await req.json();

    const response = await fetch("https://instagram120.p.rapidapi.com/api/instagram/links", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-rapidapi-key": process.env.RAPID_API_KEY!, // aman di server
            "x-rapidapi-host": "instagram120.p.rapidapi.com",
        },
        body: JSON.stringify({ url }),
    });

    const data = await response.json();
    return NextResponse.json(data);
}
