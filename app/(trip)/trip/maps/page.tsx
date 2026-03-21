"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Clock,
  Info,
  Navigation,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LocationCard from "@/components/map/LocationCard";

const TripPlannerPage = () => {
  const [tripPlan, setTripPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [weatherData, setWeatherData] = useState<any>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // ===============================
  // LOAD TRIP PLAN
  // ===============================
  useEffect(() => {
    try {
      const storedTripPlan = localStorage.getItem("tripPlanPreview");
      if (storedTripPlan) {
        setTripPlan(JSON.parse(storedTripPlan));
      }
    } catch (error) {
      console.error("Error loading trip plan:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===============================
  // FETCH WEATHER DATA
  // ===============================
  useEffect(() => {
    if (!tripPlan) return;

    const fetchWeatherData = async () => {
      try {
        const checkpoint = tripPlan.checkpoints[currentSlide];

        const queryParams = new URLSearchParams({
          lat: checkpoint.destination.latitude,
          lon: checkpoint.destination.longitude,
          days: "5",
        });

        const response = await fetch(`/api/weather?${queryParams}`);
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    fetchWeatherData();
  }, [currentSlide, tripPlan]);

  // ===============================
  // SLIDER CONTROL
  // ===============================
  const scrollToSlide = (index: number) => {
    if (!sliderRef.current) return;

    const slider = sliderRef.current;
    const slideWidth = slider.offsetWidth;

    slider.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });

    setCurrentSlide(index);
  };

  const handleScroll = (direction: "next" | "prev") => {
    const maxIndex = (tripPlan?.checkpoints.length || 1) - 1;

    const newIndex =
      direction === "next"
        ? Math.min(currentSlide + 1, maxIndex)
        : Math.max(currentSlide - 1, 0);

    scrollToSlide(newIndex);
  };

  // ===============================
  // LOADING STATE
  // ===============================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500 font-medium">
            Loading trip details...
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // NO DATA STATE
  // ===============================
  if (!tripPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 font-medium">
            No trip plan found
          </p>
          <p className="text-sm text-gray-400">
            Please create a new trip plan to get started
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // MAIN UI
  // ===============================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full px-4 py-8 space-y-8">
        
        {/* HEADER */}
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">
            {tripPlan.trip_name || "Your Trip Plan"}
          </h1>

          {/* WEATHER */}
          {weatherData && (
            <div className="flex space-x-3 mt-4 overflow-x-auto pb-2">
              {weatherData.forecast.map((day: any, index: number) => (
                <div
                  key={index}
                  className={`flex-none bg-white p-3 rounded-xl shadow-md w-44 ${
                    day.condition.toLowerCase().includes("rain")
                      ? "border border-red-400"
                      : "border border-green-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">
                    {day.date}
                  </p>
                  <p className="text-xs text-gray-500">
                    {day.condition}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    🌡 {day.mintemp_c}°C - {day.maxtemp_c}°C
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SLIDER */}
        <div className="relative">

          {/* LEFT BUTTON */}
          <button
            onClick={() => handleScroll("prev")}
            disabled={currentSlide === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg disabled:opacity-50"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* RIGHT BUTTON */}
          <button
            onClick={() => handleScroll("next")}
            disabled={currentSlide === tripPlan.checkpoints.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-lg disabled:opacity-50"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* SLIDES */}
          <div
            ref={sliderRef}
            className="flex overflow-x-hidden snap-x snap-mandatory"
          >
            {tripPlan.checkpoints.map((checkpoint: any, index: number) => (
              <div key={index} className="flex-none w-full snap-center px-4">
                <Card className="mx-auto max-w-7xl shadow-lg border-0">
                  
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-3">
                      <Navigation className="text-blue-500" />
                      Checkpoint {index + 1}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6 grid lg:grid-cols-2 gap-8">

                    {/* LEFT INFO */}
                    <div className="space-y-6">

                      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">

                        {/* FROM */}
                        <div className="flex gap-3">
                          <MapPin className="text-green-500" />
                          <div>
                            <p className="font-medium">From</p>
                            <p>{checkpoint.origin.location}</p>
                          </div>
                        </div>

                        {/* TO */}
                        <div className="flex gap-3">
                          <MapPin className="text-red-500" />
                          <div>
                            <p className="font-medium">To</p>
                            <p>{checkpoint.destination.location}</p>
                          </div>
                        </div>

                        {/* TIME */}
                        <div className="flex gap-3">
                          <Clock className="text-blue-500" />
                          <div>
                            <p className="font-medium">Schedule</p>
                            <p>
                              Departure: {checkpoint.logistics.departure_time}
                            </p>
                            <p>
                              Arrival: {checkpoint.logistics.arrival_time}
                            </p>
                          </div>
                        </div>

                        {/* TIPS */}
                        {checkpoint.logistics.tips && (
                          <div className="flex gap-3">
                            <Info className="text-yellow-500" />
                            <div>
                              <p className="font-medium">Tips</p>
                              <p className="text-gray-600">
                                {checkpoint.logistics.tips}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT MAP */}
                    <div className="h-[400px] rounded-lg overflow-hidden shadow-sm">
                      <LocationCard
                        origin={checkpoint.origin}
                        destination={checkpoint.destination}
                      />
                    </div>

                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* DOT INDICATORS */}
          <div className="flex justify-center mt-6 gap-2">
            {tripPlan.checkpoints.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => scrollToSlide(index)}
                className={`w-2 h-2 rounded-full ${
                  currentSlide === index
                    ? "bg-blue-500 w-4"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPlannerPage;