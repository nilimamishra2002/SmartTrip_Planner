import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { inputMessage } = await req.json();

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // 🔥 best free model
      messages: [
        {
          role: "system",
          content: `
You are a smart AI travel assistant.

You ONLY answer based on the provided trip data.

Give helpful, short, practical answers:
- weather advice
- travel tips
- route insights
- suggestions
          `,
        },
        {
          role: "user",
          content: inputMessage,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content;

    return NextResponse.json({ output: reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "AI failed" },
      { status: 500 }
    );
  }
}