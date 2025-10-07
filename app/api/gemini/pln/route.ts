import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Pakai Node.js runtime (30 detik timeout, bukan Edge 10 detik)
export const maxDuration = 30; // This function can run for a maximum of 5 seconds

export async function POST(req: Request) {
    try {
        const { base64ImageData, prompt } = await req.json();

        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: base64ImageData,
                    },
                },
                { text: prompt },
            ],
        });

        let text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        text = text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        return NextResponse.json({ text });
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
