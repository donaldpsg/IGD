import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const dirPath = path.join(process.cwd(), "public/images/samsat");
        const files = fs.readdirSync(dirPath);

        const imageFiles = files.filter((file) =>
            /\.(png|jpg|jpeg|webp|gif|heic)$/i.test(file)
        );

        // Hasil base64 mentah (tanpa prefix)
        const imagesBase64 = imageFiles.map((file) => {
            const filePath = path.join(dirPath, file);
            const data = fs.readFileSync(filePath);
            return data.toString("base64"); // <- tanpa prefix
        });

        return NextResponse.json(imagesBase64, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
