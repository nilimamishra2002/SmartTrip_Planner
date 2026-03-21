import axios from "axios";
import fs from "fs/promises";

/* ================= TYPES ================= */

type VoiceResponse = ArrayBuffer;

/* ================= TEXT → SPEECH ================= */

export async function textToSpeech(
  text: string,
  apiKey: string,
  voiceId: string = "21m00Tcm4TlvDq8ikWAM"
): Promise<VoiceResponse> {
  try {
    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        Accept: "audio/mpeg",
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      data: {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      },
      responseType: "arraybuffer",
    });

    return response.data;
  } catch (error: any) {
    console.error("TTS Error:", error?.response?.data || error.message);
    throw new Error("Failed to generate speech");
  }
}

/* ================= SAVE AUDIO ================= */

export async function saveAudioFile(
  audioBuffer: ArrayBuffer,
  filePath: string
): Promise<void> {
const uint8Array = new Uint8Array(audioBuffer);
await fs.writeFile(filePath, uint8Array);
}

/* ================= GET VOICES ================= */

export async function getVoices(apiKey: string): Promise<any> {
  try {
    const res = await axios.get(
      "https://api.elevenlabs.io/v1/voices",
      {
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    return res.data;
  } catch (error) {
    throw new Error("Failed to fetch voices");
  }
}

/* ================= ALL-IN-ONE ================= */

export async function textToSpeechToFile(
  text: string,
  apiKey: string,
  outputPath: string,
  voiceId?: string
): Promise<boolean> {
  try {
    const audio = await textToSpeech(text, apiKey, voiceId);
    await saveAudioFile(audio, outputPath);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}