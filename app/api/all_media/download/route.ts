import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { url } = await req.json();

    const response = await fetch(url); // fetch dari server (CORS tidak berlaku di sini)
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
        headers: {
            "Content-Type": "video/mp4",
            "Content-Disposition": 'attachment; filename="video.mp4"',
        },
    });
}
