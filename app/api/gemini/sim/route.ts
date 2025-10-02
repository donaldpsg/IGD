import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Pakai Node.js runtime (30 detik timeout, bukan Edge 10 detik)
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { base64ImageData1, base64ImageData2, hari, tgl } = await req.json();

    const prompt = `Cari jadwal sim untuk hari ${hari} tanggal ${tgl} dari kedua gambar ini. 
    Output data berupa JSON dengan key polres, lokasi dan waktu. 
    Jika ada jadwal SENIN s/d SABTU itu artinya jadwal sim mencakup dari hari senin sampai sabtu. 
    Output hanya JSON, tanpa kata pengantar atau penutup.`;

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64ImageData1,
          },
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64ImageData2,
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    return NextResponse.json({ error: true, message: error.message ?? "Internal server error" }, { status: 500 });
  }
}
