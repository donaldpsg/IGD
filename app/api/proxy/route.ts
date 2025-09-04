import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // ambil query param ?url=
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
        return NextResponse.json(
            { error: "Missing url parameter" },
            { status: 400 }
        );
    }

    try {
        // fetch gambar dari target URL
        const response = await fetch(targetUrl);

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch image" },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";
        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400", // cache sehari
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error },
            { status: 500 }
        );
    }
}
