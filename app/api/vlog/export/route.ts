// app/api/vlog/export/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ffmpegPath = require("ffmpeg-static");

export async function POST(req: Request) {
    try{
  const { scenes } = await req.json();

  const tempDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const videoParts: string[] = [];

  /* ================= STEP 1: CREATE VIDEO + VOICE PER SCENE ================= */

  for (let i = 0; i < scenes.length; i++) {
    const imgPath = path.join(tempDir, `img${i}.jpg`);
    const audioPath = path.join(tempDir, `audio${i}.mp3`);
    const outputPath = path.join(tempDir, `scene${i}.mp4`);

    // download image
    const imgRes = await fetch(scenes[i].image);
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    fs.writeFileSync(imgPath, buffer);

    // generate voice
    const voiceRes = await fetch("http://localhost:3000/api/voice", {
        method: "POST",
        body: JSON.stringify({
          text: scenes[i].voiceover,
        }),
      }
    );

    const voiceArrayBuffer = await voiceRes.arrayBuffer();
    const voiceBuffer = new Uint8Array(voiceArrayBuffer);
    fs.writeFileSync(audioPath, voiceBuffer);

    // create video clip (vertical + zoom + audio)
    await new Promise((resolve, reject) => {
      const args = [
        "-loop", "1",
        "-i", imgPath,
        "-i", audioPath,
        "-t", "4",

        // vertical reel format
        "-vf",
        "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0015,1.2)':d=100",

        "-c:v", "libx264",
        "-c:a", "aac",
        "-shortest",
        "-pix_fmt", "yuv420p",
        "-y",
        outputPath,
      ];

      const ffmpegExecutable = ffmpegPath.replace("app.asar", "app.asar.unpacked");

      const ff = spawn(ffmpegPath, args, {
  windowsHide: true,
});

      ff.on("close", resolve);
      ff.on("error", reject);
    });

    videoParts.push(outputPath);
  }

  /* ================= STEP 2: CONCAT ALL SCENES ================= */

  const listFile = path.join(tempDir, "list.txt");

  fs.writeFileSync(
    listFile,
    videoParts.map((v) => `file '${v}'`).join("\n")
  );

  const mergedVideo = path.join(tempDir, "merged.mp4");

  await new Promise((resolve, reject) => {
    const args = [
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c", "copy",
      "-y",
      mergedVideo,
    ];

    const ff = spawn(ffmpegPath as string, args);
    ff.on("close", resolve);
    ff.on("error", reject);
  });

  /* ================= STEP 3: ADD BACKGROUND MUSIC ================= */

  const finalOutput = path.join(process.cwd(), "public", "final.mp4");

  await new Promise((resolve, reject) => {
    const args = [
      "-i", mergedVideo,
      "-i", path.join(process.cwd(), "public", "music.mp3"),

      "-filter_complex",
      "[1:a]volume=0.2[a1];[0:a][a1]amix=inputs=2:duration=first",

      "-c:v", "copy",
      "-c:a", "aac",
      "-shortest",
      "-y",
      finalOutput,
    ];

    const ff = spawn(ffmpegPath as string, args);
    ff.on("close", resolve);
    ff.on("error", reject);
  });

  return NextResponse.json({
    url: "/final.mp4",
  });
}catch (err: any) {
    console.error("EXPORT ERROR:", err);

    return new NextResponse(
      JSON.stringify({ error: err.message || "Export failed" }),
      { status: 500 }
    );
  }
}