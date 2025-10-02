import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Pakai Node.js runtime (30 detik timeout, bukan Edge 10 detik)
export const maxDuration = 30; // This function can run for a maximum of 5 seconds

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = result.text;

  return NextResponse.json({ text });
}
