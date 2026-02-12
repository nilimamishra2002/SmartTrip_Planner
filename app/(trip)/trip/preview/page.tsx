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

type Meal = { title: string };
type MealType = "breakfast" | "lunch" | "dinner";

type Budget = {
  total: number;
  breakdown: {
    transportation: number;
    food: number;
    accommodation: number;
    miscellaneous: number;
  };
};

type TripPlan = {
  origin: string;
  destination: string;
  days: number;
  people: number;
  journeyDate: string;
  budget: Budget;
  food: Record<string, Record<MealType, Meal>>;
  accommodation: Record<
    string,
    { title: string; location: string; rating: number }
  >;
  itinerary: { day: number; activities: string[] }[];
};

const meals: MealType[] = ["breakfast", "lunch", "dinner"];

/* ================= COMPONENT ================= */

export default function TripPreview() {
  const [tripData, setTripData] = useState<TripPlan | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  /* ========== LOAD + NORMALIZE DATA ========== */
useEffect(() => {
  const saved = localStorage.getItem("tripPlan");
  if (!saved) return;

  const parsed = JSON.parse(saved);

  // 🔥 FORCE budget normalization
  const breakdown = parsed.budget?.breakdown ?? {};

  parsed.budget = {
    total: Number(parsed.budget?.total ?? 0),
    breakdown: {
      transportation: Number(breakdown.transportation ?? 0),
      food: Number(breakdown.food ?? 0),
      accommodation: Number(breakdown.accommodation ?? 0),
      miscellaneous: Number(breakdown.miscellaneous ?? 0),
    },
  };

  // normalize food keys
  const normalizedFood: any = {};
  Object.keys(parsed.food || {}).forEach((key) => {
    if (key.startsWith("day")) {
      normalizedFood[key.replace("day", "")] = parsed.food[key];
    }
  });

  setTripData({
    ...parsed,
    food: normalizedFood,
    accommodation: parsed.accommodation ?? {},
    itinerary: parsed.itinerary ?? [],
  });
}, []);


  if (!tripData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-600" />
      </div>
    );
  }

  const MealIcon = ({ meal }: { meal: MealType }) =>
    meal === "breakfast" ? (
      <Coffee className="w-4 h-4 text-amber-500" />
    ) : meal === "lunch" ? (
      <UtensilsCrossed className="w-4 h-4 text-amber-500" />
    ) : (
      <Utensils className="w-4 h-4 text-amber-500" />
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trip Preview</h1>
        <Button
          className="bg-green-600"
          onClick={() =>
            session ? router.push("/trip") : router.push("/signin")
          }
        >
          <Check className="mr-2 h-4 w-4" /> Confirm Trip
        </Button>
      </div>

      {/* OVERVIEW */}
      <Card>
        <CardContent className="grid grid-cols-4 gap-6 p-6">
          <div className="flex items-center gap-2">
            <MapPin /> {tripData.origin} → {tripData.destination}
          </div>
          <div className="flex items-center gap-2">
            <Calendar /> {tripData.days} Days
          </div>
          <div className="flex items-center gap-2">
            <Users /> {tripData.people} People
          </div>
          <div className="flex items-center gap-2">
            <Banknote /> ₹{tripData.budget.total}
          </div>
        </CardContent>
      </Card>

      {/* BUDGET */}
<Card className="bg-gradient-to-br from-black via-zinc-900 to-black border border-zinc-800">
  <CardHeader>
    <CardTitle className="text-white">Budget Breakdown</CardTitle>
  </CardHeader>

  <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
    {Object.entries(tripData.budget.breakdown).map(([key, value]) => (
      <div
        key={key}
        className="p-4 rounded-xl bg-zinc-900 border border-zinc-700"
      >
        <p className="capitalize text-sm text-zinc-400">{key}</p>
        <p className="text-xl font-bold text-white">₹{value}</p>
      </div>
    ))}
  </CardContent>
</Card>



      {/* FOOD PLAN */}
      <Card>
        <CardHeader>
          <CardTitle>Food Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {Array.from({ length: tripData.days }).map((_, i) => {
              const dayKey = String(i + 1);
              return (
                <AccordionItem key={dayKey} value={dayKey}>
                  <AccordionTrigger>Day {dayKey}</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    {meals.map((meal) => {
                      const item = tripData.food?.[dayKey]?.[meal];
                      return item ? (
                        <div
                          key={meal}
                          className="flex items-center gap-2"
                        >
                          <MealIcon meal={meal} />
                          <span className="capitalize">{meal}:</span>
                          <span>{item.title}</span>
                        </div>
                      ) : null;
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* ACCOMMODATION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Hotel /> Accommodation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(tripData.accommodation).map(([day, hotel]: any) => (
            <div key={day} className="border rounded p-3">
              <p className="font-semibold">
                Day {day.replace("day", "")}
              </p>
              <p>{hotel.title}</p>
              <p className="text-sm text-muted-foreground">
                {hotel.location} • ⭐ {hotel.rating}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ITINERARY */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Route /> Daily Itinerary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tripData.itinerary.map((day) => (
            <div key={day.day}>
              <p className="font-semibold">Day {day.day}</p>
              <ul className="list-disc ml-6 text-sm">
                {day.activities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
