import { NextResponse } from "next/server";
import axios from "axios";

const pythonServer = process.env.PYTHON_SERVER_URL;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json(
      { error: "Missing text" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.post(
      `${pythonServer}/extract_trip_data/invoke`,
      {
        input: {
          text
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("EXTRACT ERROR:", err.response?.data || err.message);
    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 500 }
    );
  }
}
