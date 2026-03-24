"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function AuthenticationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) return;

    setLoading(true);

    await signIn("credentials", {
      email,
      redirect: true,
      callbackUrl: "/trip",
    });

    setLoading(false);
  };

  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      
      {/* TOP RIGHT BUTTON */}
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 hidden top-4 md:right-8 md:top-8"
        )}
      >
        Home
      </Link>

      {/* LEFT PANEL (UNCHANGED) */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />

        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          SmartTrip
        </div>

        <div className="absolute inset-0 z-0">
          <DotLottieReact
            src="land2.json"
            loop
            autoplay
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              Enjoy the journey, love the destination.
            </p>
            <footer className="text-sm">Code Crusaders</footer>
          </blockquote>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">

          {/* HEADER */}
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Log in
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to access SmartTrip
            </p>
          </div>

          {/* EMAIL INPUT (NEW) */}
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-all shadow-lg"
          >
            {loading ? "Logging in..." : "Continue"}
          </button>

          {/* INFO TEXT */}
          <p className="text-center text-sm text-muted-foreground">
            Only invited users can access SmartTrip
          </p>

        </div>
      </div>
    </div>
  );
}