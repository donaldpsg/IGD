import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { content, path, message } = await req.json();

        // content: string yang mau disimpan
        // path: nama file di repo misal 'data/file.txt'
        // message: commit message

        const githubToken = process.env.GITHUB_TOKEN!;
        const owner = "username-kamu"; // ganti dengan username kamu
        const repo = "nama-repo-kamu"; // ganti dengan nama repo
        const branch = "main"; // atau nama branch lain

        // Cek apakah file sudah ada (untuk dapat sha)
        const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const headers = {
            Authorization: `token ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
        };

        let sha: string | undefined = undefined;
        const check = await fetch(fileUrl, { headers });
        if (check.ok) {
            const data = await check.json();
            sha = data.sha;
        }

        // Encode content ke base64
        const base64Content = Buffer.from(content).toString("base64");

        // Buat / update file
        const res = await fetch(fileUrl, {
            method: "PUT",
            headers,
            body: JSON.stringify({
                message: message || "update via API",
                content: base64Content,
                branch,
                sha, // opsional, hanya jika file sudah ada
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ error: err }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json(
            { error },
            { status: 500 }
        );
    }
}
