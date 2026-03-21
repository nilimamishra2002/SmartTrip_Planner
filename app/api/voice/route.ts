import { NextResponse } from "next/server";
import { textToSpeech } from "@/app/(trip)/trip/vlogs/text_to_speech";

import dotenv from "dotenv";
dotenv.config();

export async function POST(req: Request) {
    console.log("API KEY:", process.env.ELEVENLABS_API_KEY);
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text required" },
        { status: 400 }
      );
    }

    const audioBuffer = await textToSpeech(
      text,
      process.env.ELEVENLABS_API_KEY!
    );

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg", // 🔥 IMPORTANT
      },
    });

    
  } catch (err) {
    console.error("VOICE ERROR:", err);
    return NextResponse.json(
      { error: "Voice failed" },
      { status: 500 }
    );
  }
}