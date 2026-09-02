// app/api/instagram/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json();

  const apiUrl = `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${encodeURIComponent(url)}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-key": process.env.RAPID_API_KEY!,
      "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
    },
  });

  const result = await response.json();
  const d = result.data;

  const isVideo = d.is_video || d.media_type === 2;

  const urls = isVideo
    ? [{ url: d.video_url || d.video_versions?.[0]?.url || "" }]
    : (d.image_versions?.items ?? []).map((img: { url: string }) => ({ url: img.url }));

  const transformed = [
    {
      pictureUrl: d.thumbnail_url || d.image_versions?.items?.[0]?.url || "",
      urls,
      meta: {
        title: d.caption?.text || "",
        username: d.user?.username || "",
        sourceUrl: `https://www.instagram.com/p/${d.code}/`,
      },
    },
  ];

  return NextResponse.json(transformed);
}
