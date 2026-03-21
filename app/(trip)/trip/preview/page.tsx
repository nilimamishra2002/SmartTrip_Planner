"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Users,
  Calendar,
  Banknote,
  Check,
  Coffee,
  Utensils,
  UtensilsCrossed,
  Hotel,
  Route,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ================= TYPES ================= */

type MealType = "breakfast" | "lunch" | "dinner";

type TripPlan = any;

/* ================= COMPONENT ================= */

export default function TripPreview() {
  const [tripData, setTripData] = useState<TripPlan | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  /* ========== LOAD FROM LOCAL STORAGE ========== */

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tripPlan");
      if (!saved) return;

      const parsed = JSON.parse(saved);

      // 🔒 Safe budget normalization
      const breakdown = parsed?.budget?.breakdown ?? {};

      parsed.budget = {
        total: Number(parsed?.budget?.total ?? 0),
        breakdown: {
          transportation: Number(breakdown.transportation ?? 0),
          food: Number(breakdown.food ?? 0),
          accommodation: Number(breakdown.accommodation ?? 0),
          miscellaneous: Number(breakdown.miscellaneous ?? 0),
        },
      };

      parsed.food = parsed?.food ?? {};
      parsed.accommodation = parsed?.accommodation ?? {};
      parsed.itinerary = parsed?.itinerary ?? [];
      parsed.days = Number(parsed?.days ?? 0);

      setTripData(parsed);
    } catch (err) {
      console.error("Preview parse error:", err);
    }
  }, []);

  if (!tripData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-600" />
      </div>
    );
  }

  const meals: MealType[] = ["breakfast", "lunch", "dinner"];

  const MealIcon = ({ meal }: { meal: MealType }) =>
    meal === "breakfast" ? (
      <Coffee className="w-4 h-4 text-amber-500" />
    ) : meal === "lunch" ? (
      <UtensilsCrossed className="w-4 h-4 text-amber-500" />
    ) : (
      <Utensils className="w-4 h-4 text-amber-500" />
    );

const handleConfirm = async () => {
  try {
    if (!session) {
      router.push("/signin?callbackUrl=/preview");
      return;
    }

    const res = await fetch("/api/trip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: tripData,
      }),
    });

    if (!res.ok) {
      console.error("Failed to save trip");
      return;
    }

    const created = await res.json();

    if (created?.id) {
      localStorage.setItem("selectedTripId", created.id);
      router.push("/trip");
    }

  } catch (err) {
    console.error("Confirm trip error:", err);
  }
};

//     const savedTrip = await res.json();

//     // 🔥 IMPORTANT: redirect using id from DB
//     router.push(`/trip/${savedTrip.id}`);
//   } catch (err) {
//     console.error("Confirm trip error:", err);
//   }
// };

// const handleConfirmClick = async () => {
//   const saved = localStorage.getItem("tripPlan");
//   if (!saved) return;

//   const tripData = JSON.parse(saved);

//   if (!session) {
//     router.push("/signin?callbackUrl=/preview");
//     return;
//   }

//   const res = await fetch("/api/trip", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       data: tripData,
//     }),
//   });

//   const created = await res.json();

//   if (created?.id) {
//     router.push(`/trip/${created.id}`);
//   }
// };

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-950 text-white p-8 space-y-10">

    {/* ================= HEADER ================= */}
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Trip Preview
        </h1>
        <p className="text-slate-400 mt-1">
          Review your intelligent travel plan before confirmation
        </p>
      </div>

      <Button
        onClick={handleConfirm}
        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl shadow-lg shadow-emerald-900/40 transition-all"
      >
        <Check className="mr-2 h-4 w-4" />
        Confirm Trip
      </Button>
    </div>

    {/* ================= OVERVIEW ================= */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-700">
        <MapPin className="text-indigo-400 mb-2" />
        <p className="text-slate-400 text-sm">Route</p>
        <p className="text-xl font-semibold">
          {tripData.origin} → {tripData.destination}
        </p>
      </div>

      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-700">
        <Calendar className="text-purple-400 mb-2" />
        <p className="text-slate-400 text-sm">Duration</p>
        <p className="text-xl font-semibold">
          {tripData.days} Days
        </p>
      </div>

      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-700">
        <Users className="text-cyan-400 mb-2" />
        <p className="text-slate-400 text-sm">Travelers</p>
        <p className="text-xl font-semibold">
          {tripData.people} People
        </p>
      </div>

      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-700">
        <Banknote className="text-emerald-400 mb-2" />
        <p className="text-slate-400 text-sm">Total Budget</p>
        <p className="text-xl font-semibold text-emerald-400">
          ₹{tripData.budget?.total ?? 0}
        </p>
      </div>

    </div>

    {/* ================= BUDGET ================= */}
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700">
      <h2 className="text-2xl font-semibold mb-6">
        Budget Breakdown
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(tripData.budget?.breakdown ?? {}).map(
          ([key, value]) => (
            <div
              key={key}
              className="bg-slate-900 rounded-xl p-5 border border-slate-700 hover:border-indigo-500 transition"
            >
              <p className="text-slate-400 capitalize text-sm">
                {key}
              </p>
              <p className="text-lg font-bold mt-1 text-white">
                ₹{Number(value)}
              </p>
            </div>
          )
        )}
      </div>
    </div>

    {/* ================= FOOD PLAN ================= */}
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700">
      <h2 className="text-2xl font-semibold mb-6">
        Food Plan
      </h2>

      <Accordion type="single" collapsible>
        {Array.from({ length: tripData.days ?? 0 }).map((_, i) => {
          const dayKey = `day${i + 1}`;

          return (
            <AccordionItem key={dayKey} value={dayKey}>
              <AccordionTrigger className="text-lg font-medium text-indigo-400">
                Day {i + 1}
              </AccordionTrigger>

              <AccordionContent className="space-y-4">
                {meals.map((meal) => {
                  const item =
                    tripData.food?.[dayKey]?.[meal];
                  if (!item) return null;

                  return (
                    <div
                      key={meal}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition"
                    >
                      <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                        <MealIcon meal={meal} />
                        <span className="capitalize">{meal}</span>
                      </div>

                      <p className="mt-2 text-lg font-medium">
                        {item.title}
                      </p>

                      <p className="text-slate-400 text-sm">
                        {item.address}
                      </p>

                      <div className="flex items-center gap-2 text-sm mt-2 text-yellow-400">
                        <Star className="w-4 h-4" />
                        {item.rating}
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>

    {/* ================= ACCOMMODATION ================= */}
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Hotel className="text-indigo-400" />
        Accommodation
      </h2>

      <div className="space-y-6">
        {Object.entries(tripData.accommodation ?? {}).map(
          ([day, hotel]: any) => (
            <div
              key={day}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-indigo-500 transition"
            >
              <p className="text-indigo-400 font-semibold">
                Day {day.replace("day", "")}
              </p>

              <p className="text-lg font-semibold mt-2">
                {hotel.title}
              </p>

              <p className="text-slate-400 text-sm">
                {hotel.address}
              </p>

              <div className="flex items-center gap-2 mt-2 text-yellow-400">
                <Star className="w-4 h-4" />
                {hotel.rating}
              </div>
            </div>
          )
        )}
      </div>
    </div>

    {/* ================= ITINERARY ================= */}
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Route className="text-indigo-400" />
        Daily Itinerary
      </h2>

      <div className="space-y-6">
        {tripData.itinerary?.map((day: any) => (
          <div key={day.day}>
            <p className="text-indigo-400 font-semibold mb-2">
              Day {day.day}
            </p>

            <ul className="space-y-2">
              {day.activities?.map((activity: string, idx: number) => (
                <li
                  key={idx}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 hover:border-indigo-500 transition"
                >
                  {activity}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

  </div>
);
}