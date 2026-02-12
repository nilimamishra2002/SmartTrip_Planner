"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import TripPlan from "@/components/layout/TripPlan";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  Plane,
  Calendar,
  Users,
  MapPin,
  Plus,
  Loader2,
} from "lucide-react";

/* ================= TYPES ================= */

type TripPlanData = {
  trip_name: string;
  origin: string;
  destination: string;
  days: number;
  people: number;
  journeyDate: string;
  budget: {
    total: number;
    breakdown: {
      transportation: number;
      food: number;
      accommodation: number;
      miscellaneous: number;
    };
  };
};

type Trip = {
  id: string;
  data: TripPlanData;
};

/* ================= COMPONENT ================= */

export default function Page() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState<boolean>(true);
  const [tripPlanId, setTripPlanId] = useState<string>(
    searchParams.get("tripPlanId") || ""
  );
  const [tripPlans, setTripPlans] = useState<Trip[]>([]);
  const [selectedTripPlan, setSelectedTripPlan] = useState<Trip | null>(null);
  const [savingInProgress, setSavingInProgress] = useState<boolean>(false);

  /* ================= URL HANDLING ================= */

  const updateURL = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (tripPlanId) {
      params.set("tripPlanId", tripPlanId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [tripPlanId, pathname, router, searchParams]);

  /* ================= FETCH TRIPS ================= */

  const fetchTripPlans = async (email: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trip?email=${email}`);
      const data = await response.json();

      if (data.tripPlans?.length) {
        setTripPlans(data.tripPlans);

        const urlTripPlanId = searchParams.get("tripPlanId");
        if (urlTripPlanId) {
          const found = data.tripPlans.find(
            (plan: Trip) => plan.id === urlTripPlanId
          );
          if (found) {
            setSelectedTripPlan(found);
            setTripPlanId(found.id);
          }
        } else {
          setSelectedTripPlan(data.tripPlans[0]);
          setTripPlanId(data.tripPlans[0].id);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch trip plans.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE TRIP ================= */

  const saveTripPlan = async () => {
    const tripPlanData = localStorage.getItem("tripPlan");
    if (!tripPlanData || !session?.user?.email || savingInProgress) return;

    try {
      setSavingInProgress(true);
      setLoading(true);

      const tripPlanObj: TripPlanData = JSON.parse(tripPlanData);

      const response = await fetch("/api/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          tripPlan: tripPlanData,
        }),
      });

      const data = await response.json();

      if (data.tripPlan) {
        setTripPlans((prev) => [...prev, data.tripPlan]);
        setSelectedTripPlan(data.tripPlan);
        setTripPlanId(data.tripPlan.id);

        localStorage.removeItem("tripPlan");
        localStorage.setItem(
          "tripPlanPreview",
          JSON.stringify(data.tripPlan.data)
        );

        toast({
          title: "Trip Saved",
          description: `Your trip "${tripPlanObj.trip_name}" was saved.`,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save trip plan.",
      });
    } finally {
      setLoading(false);
      setSavingInProgress(true);
    }
  };

  /* ================= HANDLERS ================= */

  const handleTripSelection = useCallback(
    (trip: Trip) => {
      setTripPlanId(trip.id);
      setSelectedTripPlan(trip);
      localStorage.setItem("tripPlanPreview", JSON.stringify(trip.data));
      updateURL();
    },
    [updateURL]
  );

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (session?.user?.email) {
      fetchTripPlans(session.user.email);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email && !savingInProgress) {
      saveTripPlan();
    }
  }, [session?.user?.email, savingInProgress]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  /* ================= UI ================= */

  return (
    <div className="flex flex-col p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Trip Plans</h1>
          <p className="text-sm text-muted-foreground">
            Manage and view your travel itineraries
          </p>
        </div>
        <Button asChild>
          <a href="/" className="flex items-center gap-2">
            <Plus size={16} /> Create New Trip
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LIST */}
        <div>
          {loading ? (
            <div className="flex justify-center h-40 items-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[70vh]">
              {tripPlans.map((trip) => (
                <Card
                  key={trip.id}
                  className={`m-2 cursor-pointer ${
                    selectedTripPlan?.id === trip.id
                      ? "ring-1 ring-violet-600"
                      : ""
                  }`}
                  onClick={() => handleTripSelection(trip)}
                >
                  <CardHeader>
                    <CardTitle className="flex gap-2">
                      <Plane size={18} />
                      {trip.data.trip_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <Calendar size={14} /> {trip.data.journeyDate}
                    </div>
                    <div className="flex gap-2">
                      <MapPin size={14} />
                      {trip.data.origin} → {trip.data.destination}
                    </div>
                    <div className="flex gap-2">
                      <Users size={14} /> {trip.data.people} people
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          )}
        </div>

        {/* DETAILS */}
        <div className="lg:col-span-2">
          {selectedTripPlan ? (
            <ScrollArea className="h-[70vh]">
              <TripPlan tripPlan={selectedTripPlan} />
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="h-40 flex items-center justify-center">
                Select a trip plan to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
