"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  Banknote,
  Star,
  Edit,
  Save,
  X,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import AiBot from "@/components/ai-bot/page";



const LocationCard = dynamic(
  () => import("@/components/map/LocationCard"),
  { ssr: false }
);

interface TripPlanProps {
  tripPlan: any;
}

export default function TripPlan({ tripPlan }: TripPlanProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

if (status === "loading") {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex flex-col items-center gap-4">

        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>

        {/* Text */}
        <p className="text-white text-sm tracking-wide">
          Loading your trip...
        </p>

      </div>
    </div>
  );
}

if (!session) {
  router.push("/signin");
}
  const isOwner = tripPlan?.authorId === session?.user?.id;

  const initialData = tripPlan?.data ?? {};

  const [tripData, setTripData] = useState<any>(initialData);
  useEffect(() => {
  if (tripPlan?.data) {
    setTripData(tripPlan.data);
    setEditData(tripPlan.data);
    setSelectedCheckpoint(0); // reset selection
    setWeatherData(null);
  }
}, [tripPlan]);
  console.log("TripData FULL:", tripData);
  const [editData, setEditData] = useState<any>(initialData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);

  const current = isEditMode ? editData : tripData;

  const [weatherData, setWeatherData] = useState<any>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(0);

const checkpoints =
  tripData?.checkPoints ||
  tripData?.checkpoints ||
  [];

  console.log("Checkpoints:", checkpoints);
console.log("First checkpoint:", checkpoints[0]);

useEffect(() => {
const checkpoints =
  current?.checkpoints ||
  current?.checkPoints ||
  [];

  if (!checkpoints.length) return;

  const checkpoint = checkpoints[selectedCheckpoint];

  const lat = checkpoint?.destination?.lat;
  const lon = checkpoint?.destination?.lng;

  console.log("REAL DATA:", realData);
  console.log("LAT LON:", lat, lon);

  if (!lat || !lon) {
    console.warn("Invalid coords:", checkpoint);
    return;
  }

  const fetchWeather = async () => {
    try {
      const params = new URLSearchParams({
        lat,
        lon,
        days: "5",
      });

      const res = await fetch(`/api/weather?${params}`);
      const data = await res.json();

      setWeatherData(data?.forecast ? data : null);
    } catch (err) {
      console.error(err);
      setWeatherData(null);
    }
  };

  fetchWeather();
}, [selectedCheckpoint, current]);

  /* ================= SAVE / REGENERATE ================= */

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const hasCoreChange =
        editData.origin !== tripData.origin ||
        editData.destination !== tripData.destination ||
        editData.days !== tripData.days ||
        editData.people !== tripData.people;

      const endpoint = hasCoreChange ? "/api/trip/regenerate" : "/api/trip";

      const method = hasCoreChange ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripPlanId: tripPlan.id,
          data: editData,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      const updated = await res.json();

      setTripData(updated.data);
      setEditData(updated.data);
      setIsEditMode(false);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  /* ================= ADD MEMBER ================= */

  const handleAddMember = async (email: string) => {
    try {
      const res = await fetch("/api/trip", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripPlanId: tripPlan.id,
          email,
        }),
      });

      if (!res.ok) throw new Error("Failed to add");

      // safest refresh
      window.location.reload();
    } catch (err) {
      console.error("Add member error:", err);
    }
  };

  /* ================= FETCH BLOGS ================= */

  const fetchBlogs = async () => {
    const res = await fetch(`/api/blog?tripPlanId=${tripPlan.id}`);
    const data = await res.json();
    console.log("Fetched blogs:", data); // 🔥 debug
    setBlogs(data.blogs || []);
  };

useEffect(() => {
  if (tripPlan?.id) {
    fetchBlogs();
  }
}, [tripPlan?.id]);

  // if (!current) return <div>Loading...</div>;

  const handleDelete = async () => {
  const confirmDelete = confirm("Are you sure you want to delete this trip?");
  if (!confirmDelete) return;

  try {
    const res = await fetch("/api/trip", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tripPlanId: tripPlan.id,
      }),
    });

    if (!res.ok) throw new Error("Delete failed");

    // 🔥 redirect after delete
    window.location.href = "/trip"; // or dashboard
  } catch (err) {
    console.error(err);
    alert("Failed to delete trip");
  }
};

const [realData, setRealData] = useState<any>({});
const fetchRealData = async (lat: number, lon: number) => {
  try {
    const [hotelsRes, foodRes, amenitiesRes] = await Promise.all([
      fetch(`/api/places?lat=${lat}&lon=${lon}&type=hotel`),
      fetch(`/api/places?lat=${lat}&lon=${lon}&type=restaurant`),
      fetch(`/api/amenities?lat=${lat}&lon=${lon}`)
    ]);

    const hotels = await hotelsRes.json();
    const food = await foodRes.json();
    const amenities = await amenitiesRes.json();

    return {
      hotels,
      food,
      amenities,
    };
  } catch (err) {
    console.error("Real data failed:", err);
    return null;
  }
};

useEffect(() => {
  const checkpoints =
    current?.checkpoints || current?.checkPoints || [];

  if (!checkpoints.length) return;

  const checkpoint = checkpoints[selectedCheckpoint];

const lat =
  checkpoint?.destination?.lat ||
  checkpoint?.destination?.latitude;

const lon =
  checkpoint?.destination?.lng ||
  checkpoint?.destination?.longitude;

  if (!lat || !lon) return;

  const load = async () => {
    const data = await fetchRealData(lat, lon);

    if (data) {
      setRealData(data);
    } else {
      setRealData({}); // fallback trigger
    }
  };

  load();
}, [selectedCheckpoint, current]);

useEffect(() => {
  if (!tripData) return;

  const checkpoint = checkpoints?.[0]; // ONLY FIRST

  fetch(`/api/places?...`)
  fetch(`/api/amenities?...`)
}, [tripData.id]);

const [amenities, setAmenities] = useState<any[]>([]);

useEffect(() => {
  const cp = current.checkpoints?.[selectedCheckpoint];

  if (!cp) return;

  fetch(`/api/amenities?lat=${cp.destination.lat}&lon=${cp.destination.lng}`)
    .then(res => res.json())
    .then(data => setAmenities(data?.amenities || []))
    .catch(() => setAmenities([]));
}, [selectedCheckpoint, current]);

  /* ================= UI ================= */

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white p-8">
    {/* ================= HEADER ================= */}
    <div className="flex justify-between items-start mb-10">
      <div>
        {isEditMode ? (
          <div className="flex gap-4">
            <Input
              value={editData.origin}
              onChange={(e) =>
                setEditData({ ...editData, origin: e.target.value })
              }
            />
            <Input
              value={editData.destination}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  destination: e.target.value,
                })
              }
            />
          </div>
        ) : (
          <h1 className="text-4xl font-bold">
            {current.origin} → {current.destination}
          </h1>
        )}
        <p className="text-slate-400 mt-2">
          {current.days} Days • {current.people} Travelers • ₹
          {current?.budget?.total}
        </p>
      </div>

      <div>
        {isEditMode ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setEditData(tripData);
                setIsEditMode(false);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
  {isOwner && (
  <Button onClick={() => setIsEditMode(true)}>
    Edit Trip
  </Button>
)}

{isOwner && (
  <Button variant="destructive" onClick={handleDelete}>
    Delete
  </Button>
)}
</div>
        )}
      </div>
    </div>

    {/* ================= TABS ================= */}
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-9 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
        <TabsTrigger value="map">Map</TabsTrigger>
<TabsTrigger value="weather">Weather</TabsTrigger>
        <TabsTrigger value="mates">Tourmates</TabsTrigger>
        <TabsTrigger value="blogs">Blogs</TabsTrigger>
        <TabsTrigger value="media">Media</TabsTrigger>
<TabsTrigger value="vlogs">Vlogs</TabsTrigger>
<TabsTrigger value="assistant">AI</TabsTrigger>
      </TabsList>

      {/* ================= OVERVIEW ================= */}
      <TabsContent value="overview">
  <div className="space-y-8">

    {/* EXISTING GRID (UNCHANGED STYLE) */}
    <div className="grid md:grid-cols-4 gap-6 text-center">
      <div>
        <Calendar className="mx-auto mb-2" />
        <p>{current.days} Days</p>
      </div>
      <div>
        <Users className="mx-auto mb-2" />
        <p>{current.people} Travelers</p>
      </div>
      <div>
        <Banknote className="mx-auto mb-2" />
        <p>₹{current?.budget?.total}</p>
      </div>
      <div>
        <MapPin className="mx-auto mb-2" />
        <p>
          {current.origin} → {current.destination}
        </p>
      </div>
    </div>

    {/* 🔥 ADDED (ONLY NEW THING) */}
    <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold mb-4">
        Budget Breakdown
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          🚗
          <p className="text-sm">Transport</p>
          <p className="font-semibold">
            ₹{current?.budget?.breakdown?.transportation}
          </p>
        </div>

        <div>
          🍽️
          <p className="text-sm">Food</p>
          <p className="font-semibold">
            ₹{current?.budget?.breakdown?.food}
          </p>
        </div>

        <div>
          🏨
          <p className="text-sm">Stay</p>
          <p className="font-semibold">
            ₹{current?.budget?.breakdown?.accommodation}
          </p>
        </div>

        <div>
          🎟️
          <p className="text-sm">Misc</p>
          <p className="font-semibold">
            ₹{current?.budget?.breakdown?.miscellaneous}
          </p>
        </div>
      </div>
    </div>

  </div>
</TabsContent>

{/* ================= ITINERARY ================= */}
<TabsContent value="itinerary">
  <div className="space-y-10">

    {current.itinerary?.map((day: any, i: number) => {
      const dayKey = `day${i + 1}`;
      const meals =
  current.food?.[dayKey] ||
  current.food?.day1 || // fallback
  null;
      const stay = current.accommodation?.[dayKey];
      const checkpoint = current.checkpoints?.[i];
      // const amenities = realData?.amenities?.[dayKey] || [];

      return (
        <div
          key={day.day}
          className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl"
        >
          {/* ===== DAY HEADER ===== */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-indigo-400">
              Day {day.day}
            </h2>

            <span className="text-xs bg-indigo-600/20 px-3 py-1 rounded-full">
              Planned
            </span>
          </div>

          {/* ===== ACTIVITIES ===== */}
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-3">📍 Activities</p>

            <div className="space-y-3">
              {day.activities?.map((activity: string, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 hover:border-indigo-500 transition"
                >
                  {activity}
                </div>
              ))}
            </div>
          </div>

          {/* ===== MEALS ===== */}
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-3">🍽 Meals</p>

            <div className="grid md:grid-cols-3 gap-4">
              {["breakfast", "lunch", "dinner"].map((meal) => {
                const item = meals?.[meal];
                if (!item) return null;

                return (
                  <div
                    key={meal}
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title + " " + item.address)}`
                      )
                    }
                    className="cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-4 hover:border-indigo-500 transition"
                  >
                    <p className="text-xs text-slate-400 capitalize">
                      {meal}
                    </p>

                    <p className="font-semibold mt-1">{item.title}</p>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-yellow-400 text-sm">
                        ⭐ {item.rating}
                      </span>
                      <span className="text-xs text-slate-400">
                        {item.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== STAY ===== */}
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-3">🏨 Accommodation</p>

            {stay ? (
              <div
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.title + " " + stay.address)}`
                  )
                }
                className="cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 hover:border-indigo-500 transition"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg">{stay.title}</p>
                  <span className="text-yellow-400">
                    ⭐ {stay.rating}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  {stay.category}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  {stay.address}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No stay data available
              </p>
            )}
          </div>

          {/* ===== TRAVEL INFO ===== */}
          {checkpoint && (
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-3">
                🚗 Travel Info
              </p>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
                <p className="text-sm">
                  <span className="text-slate-400">From:</span>{" "}
                  {checkpoint.origin.location}
                </p>

                <p className="text-sm">
                  <span className="text-slate-400">To:</span>{" "}
                  {checkpoint.destination.location}
                </p>

                <p className="text-xs text-slate-400">
                  🕒 {checkpoint.logistics.departure_time} →{" "}
                  {checkpoint.logistics.arrival_time}
                </p>

                <p className="text-xs text-slate-500">
                  {checkpoint.logistics.tips}
                </p>

                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&origin=${checkpoint.origin.lat},${checkpoint.origin.lng}&destination=${checkpoint.destination.lat},${checkpoint.destination.lng}`
                    )
                  }
                  className="mt-2 text-xs bg-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-700"
                >
                  View Route
                </button>
              </div>
            </div>
          )}
          {/* ===== AMENITIES ===== */}
<div className="mt-6">
  <details className="group">
    <summary className="cursor-pointer text-sm text-slate-400 flex items-center justify-between">
      🚨 Nearby Essentials
      <span className="text-xs group-open:rotate-180 transition">▼</span>
    </summary>

    <div className="mt-4 grid md:grid-cols-3 gap-3">
      {amenities?.length > 0 ? (
        amenities.slice(0, 6).map((a: any, i: number) => (
          <div
            key={i}
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lon}`
              )
            }
            className="cursor-pointer bg-slate-800 border border-slate-700 p-3 rounded-lg hover:border-indigo-500 transition"
          >
            <p className="text-sm font-medium">{a.name}</p>
            <p className="text-xs text-slate-400">{a.type}</p>
          </div>
        ))
      ) : (
        <p className="text-xs text-slate-500">
          No nearby amenities available
        </p>
      )}
    </div>
  </details>
</div>
        </div>
      );
    })}
  </div>
</TabsContent>

      <TabsContent value="map">
  <div className="space-y-6">

    {/* CHECKPOINT SELECTOR */}
    <div className="flex gap-2 flex-wrap">
      {current?.checkpoints?.map((_: any, index: number) => (
        <Button
          key={index}
          variant={selectedCheckpoint === index ? "default" : "outline"}
          onClick={() => setSelectedCheckpoint(index)}
        >
          Stop {index + 1}
        </Button>
      ))}
    </div>

    {/* MAP */}
{current?.checkpoints?.[selectedCheckpoint] && (
  <div className="h-[500px] rounded-xl overflow-hidden">
    <LocationCard
      origin={{
        latitude: current.checkpoints[selectedCheckpoint].origin.lat,
        longitude: current.checkpoints[selectedCheckpoint].origin.lng,
        location:
          current.checkpoints[selectedCheckpoint].origin.location,
      }}
      destination={{
        latitude: current.checkpoints[selectedCheckpoint].destination.lat,
        longitude:
          current.checkpoints[selectedCheckpoint].destination.lng,
        location:
          current.checkpoints[selectedCheckpoint].destination.location,
      }}
    />
  </div>
)}
  </div>
</TabsContent>

<TabsContent value="weather">
  <div className="space-y-6">

    {/* CHECKPOINT SELECTOR */}
    <div className="flex gap-2 flex-wrap">
      {current?.checkpoints?.map((_: any, index: number) => (
        <Button
          key={index}
          variant={selectedCheckpoint === index ? "default" : "outline"}
          onClick={() => setSelectedCheckpoint(index)}
        >
          Stop {index + 1}
        </Button>
      ))}
    </div>

    {/* WEATHER DISPLAY */}
    {weatherData?.forecast?.length > 0 ? (
  <div className="flex gap-4 overflow-x-auto">
    {weatherData.forecast.map((day: any, i: number) => (
      <div
        key={i}
        className={`min-w-[180px] p-4 rounded-xl shadow-lg ${
          day.condition.toLowerCase().includes("rain")
            ? "bg-red-900/40 border border-red-500"
            : "bg-slate-800 border border-slate-700"
        }`}
      >
        <p className="font-semibold">{day.date}</p>
        <p className="text-sm text-slate-300">{day.condition}</p>

        <p className="mt-2">
          🌡 {day.mintemp_c}°C - {day.maxtemp_c}°C
        </p>
      </div>
    ))}
  </div>
) : (
  <p className="text-slate-400">
    Weather data not available
  </p>
)}
</div>
</TabsContent>

      {/* ================= TOUR MATES ================= */}
      <TabsContent value="mates">
        <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tour Mates</h2>

            {isOwner && (
            <Button
              size="sm"
              onClick={() => {
                const email = prompt("Enter member email");
                if (email) handleAddMember(email);
              }}
              className="bg-indigo-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
)}
          </div>

          {/* Logged-in user
          {session?.user && (
            <div className="bg-indigo-900 border border-indigo-500 rounded-lg p-4 mb-3">
              <p>{session.user.email} (You)</p>
            </div>
          )} */}

          {/* Members from Prisma relation */}
{tripPlan.members?.length > 0 ? (
  tripPlan.members.map((mate: any) => {
    const isYou = mate.email === session?.user?.email;
    const isCreator = mate.id === tripPlan.authorId;

    return (
      <div
        key={mate.id}
        className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-2 flex justify-between items-center"
      >
        <div className="flex flex-col">
          <p className="text-white font-medium">
            {mate.email}
          </p>

          <div className="flex gap-2 mt-1">
            {isYou && (
              <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded">
                You
              </span>
            )}

            {isCreator && (
              <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">
                Owner
              </span>
            )}
          </div>
        </div>

        {/* DELETE BUTTON (ONLY FOR OTHERS, NOT OWNER) */}
        {isOwner && !isCreator && !isYou && (
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              await fetch("/api/trip", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tripPlanId: tripPlan.id,
                  memberId: mate.id,
                }),
              });

              window.location.reload();
            }}
          >
            Delete
          </Button>
        )}
      </div>
    );
  })
) : (
  <p className="text-slate-400 text-sm">
    No additional tour mates added yet
  </p>
)}
        </div>
      </TabsContent>

      {/* ================= BLOGS ================= */}
      <TabsContent value="blogs">
        <div className="space-y-6">
          <Button
            onClick={async () => {
  try {
    const query = prompt("What should the blog focus on?");
    if (!query) return;

    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripPlanId: tripPlan.id,
        query,
      }),
    });

    const data = await res.json();

    console.log("BLOG RESPONSE:", data); // 🔥 debug

    if (data?.savedBlog) {
      setBlogs((prev: any[]) => [data.savedBlog, ...prev]);
    }

    fetchBlogs();
  } catch (err) {
    console.error(err);
  }
}}
            className="bg-purple-600"
          >
            Generate Blog
          </Button>

          {blogs.length === 0 ? (
            <p className="text-slate-400">No blogs generated yet.</p>
          ) : (
      blogs
  ?.filter((blog) => blog && blog.id)
  .map((blog: any) => {
    let title = blog?.title;
    let content = blog?.content;

    // 🔥 HANDLE JSON STRING CASE
    try {
      const parsed = JSON.parse(blog.content);
      if (parsed?.content) {
        title = parsed.title;
        content = parsed.content;
      }
    } catch {
      // normal string → do nothing
    }

    return (
      <div
        key={blog.id}
        className="bg-slate-800 p-6 rounded-xl flex justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold">
            {title || "Untitled Blog"}
          </h3>

          <p className="text-slate-400 mt-2 whitespace-pre-line">
            {content || "No content available."}
          </p>
        </div>

        {/* DELETE BLOG */}
        <Button
          size="sm"
          variant="destructive"
          onClick={async () => {
            await fetch("/api/blog", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ blogId: blog.id }),
            });

            setBlogs((prev) =>
              prev.filter((b) => b.id !== blog.id)
            );
          }}
        >
          Delete
        </Button>
      </div>
    );
  })
          )}
        </div>
      </TabsContent>

<TabsContent value="media">
  <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700 space-y-6">

    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Trip Media</h2>

      <Button
        className="bg-indigo-600"
        onClick={() =>
          window.location.href = `/trip/media?tripPlanId=${tripPlan.id}`
        }
      >
        Open Media
      </Button>
    </div>

  </div>
</TabsContent>
      
<TabsContent value="vlogs">
  <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700 space-y-6">

    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Vlogs</h2>

      <Button
        className="bg-purple-600"
        onClick={() =>
          window.location.href = `/trip/vlogs?tripPlanId=${tripPlan.id}`
        }
      >
        Open Vlogs
      </Button>
    </div>

  </div>
</TabsContent>
<TabsContent value="assistant">
  <AiBot tripData={current} />
</TabsContent>
    </Tabs>
  </div>
);
}
