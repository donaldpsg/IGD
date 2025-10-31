// app/api/instagram/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {

    try {
        const formData = await req.formData();
        const pid = formData.get("pid") as string;

        const response = await fetch(`https://twitter241.p.rapidapi.com/tweet-v2?pid=${pid}`, {
            method: "GET",
            headers: {
                "x-rapidapi-key": process.env.RAPID_API_KEY!, // aman di server
                "x-rapidapi-host": "twitter241.p.rapidapi.com",
            },
        });

        const data = await response.json();
        return NextResponse.json({ data: data.result.tweetResult.result, pid: pid });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }

}
