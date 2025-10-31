import { NextResponse } from "next/server";

// buat nama acak untuk file
function randomFilename(ext = "jpg") {
    const random = Math.random().toString(36).substring(2, 10);
    return `image-${random}.${ext}`;
}

export async function POST(req: Request) {
    try {
        const { url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
        }

        const response = await fetch(url);
        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            );
        }

        const arrayBuffer = await response.arrayBuffer();

        // ambil ekstensi dari query string, misal format=jpg
        const formatMatch = url.match(/format=([a-zA-Z0-9]+)/);
        const ext = formatMatch ? formatMatch[1] : "jpg";
        const filename = randomFilename(ext);

        return new NextResponse(arrayBuffer, {
            headers: {
                "Content-Type": `image/${ext}`,
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
