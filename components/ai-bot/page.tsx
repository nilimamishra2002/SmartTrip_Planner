"use client";


import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import MessageBox from "@/components/MessageBox";

export default function AiBot({ tripData }: { tripData: any }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  setOutput(""); // clear previous AI response
}, [tripData]);

useEffect(() => {
  if (!tripData) return;

  const autoAsk = async () => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputMessage: `
Trip Data:
${JSON.stringify(tripData)}

Give a short summary + travel tips.
        `,
      }),
    });

    const data = await res.json();
    setOutput(data.output);
  };

  autoAsk();
}, [tripData]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputMessage: `
Trip Data:
${JSON.stringify(tripData, null, 2)}

User Question:
${input}
          `,
        }),
      });

      const data = await res.json();
      setOutput(data.output);
    } catch (err) {
      console.error(err);
      setOutput("Something went wrong...");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="space-y-4">
      <MessageBox output={output} />

      <div className="flex gap-2">
        <Input
          placeholder="Ask about your trip..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <Button onClick={handleSend} disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}