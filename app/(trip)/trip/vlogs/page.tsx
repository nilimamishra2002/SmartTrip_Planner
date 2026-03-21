"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function VlogsPage() {
  const searchParams = useSearchParams();
  const tripPlanId = searchParams.get("tripPlanId");

  const [imageOptions, setImageOptions] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const [vlogs, setVlogs] = useState<any[]>([]);
  const [activeVlog, setActiveVlog] = useState<any>(null);
  const [sceneIndex, setSceneIndex] = useState(0);

  /* ================= FETCH ================= */
  const fetchVlogs = async () => {
    if (!tripPlanId) return;

    const res = await fetch(`/api/vlog/list?tripPlanId=${tripPlanId}`);
    const data = await res.json();
    setVlogs(data.vlogs || []);
  };

  const fetchImages = async () => {
    const res = await fetch(`/api/media/list?tripPlanId=${tripPlanId}`);
    const data = await res.json();
    setImageOptions(data.photos || []);
  };

  useEffect(() => {
    fetchVlogs();
  }, [tripPlanId]);

  /* ================= GENERATE ================= */
  const generateVlog = async () => {
    const res = await fetch("/api/vlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripPlanId, images: selectedImages }),
    });

    const data = await res.json();
    const scenes = data.scenes || [];

    await fetch("/api/vlog/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripPlanId,
        title: data.title,
        content: JSON.stringify(scenes),
        thumbnail: scenes[0]?.image,
      }),
    });

    setImageOptions([]);
    setSelectedImages([]);
    fetchVlogs();
  };

  /* ================= DELETE ================= */
  const deleteVlog = async (id: string) => {
    await fetch("/api/vlog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vlogId: id }),
    });

    fetchVlogs();
  };

  /* ================= AUTO PLAY ================= */
  useEffect(() => {
    if (!activeVlog) return;

    const interval = setInterval(() => {
      setSceneIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeVlog]);

  /* ================= SCENES ================= */
  const getScenes = () => {
    try {
      return JSON.parse(activeVlog?.content || "[]");
    } catch {
      return [];
    }
  };

  const scenes = getScenes();
  const current = scenes[sceneIndex % (scenes.length || 1)];

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">🎬 Travel Vlogs</h2>

          <button
            onClick={fetchImages}
            className="bg-purple-600 px-4 py-2 rounded"
          >
            Select Images
          </button>
        </div>

        {/* ================= IMAGE SELECT ================= */}
        {imageOptions.length > 0 && (
          <div className="relative bg-slate-900 p-4 rounded-xl">

            {/* CLOSE */}
            <button
              className="absolute top-2 right-3 text-xl"
              onClick={() => {
                setImageOptions([]);
                setSelectedImages([]);
              }}
            >
              ✕
            </button>

            <h3>Select Images</h3>

            <div className="grid grid-cols-3 gap-4 mt-4">
              {imageOptions.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  onClick={() =>
                    setSelectedImages((prev) =>
                      prev.includes(img.url)
                        ? prev.filter((x) => x !== img.url)
                        : [...prev, img.url]
                    )
                  }
                  className={`h-40 w-full object-cover rounded cursor-pointer ${
                    selectedImages.includes(img.url)
                      ? "border-2 border-purple-500"
                      : ""
                  }`}
                />
              ))}
            </div>

            <button
              onClick={generateVlog}
              className="mt-4 bg-purple-600 px-4 py-2 rounded"
            >
              Generate Vlog
            </button>
          </div>
        )}

        {/* ================= VLOG CARDS ================= */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vlogs.map((vlog) => (
            <div
              key={vlog.id}
              className="bg-slate-800 rounded-xl overflow-hidden"
            >
              <img src={vlog.thumbnail} className="h-48 w-full object-cover" />

              <div className="p-3 space-y-2">
                <h3 className="text-sm">{vlog.title}</h3>

                <div className="flex gap-2">
                  {/* WATCH */}
                  <button
                    onClick={() => {
                      setActiveVlog(vlog);
                      setSceneIndex(0);
                    }}
                    className="bg-indigo-600 px-3 py-1 rounded text-sm"
                  >
                    Watch
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={() => deleteVlog(vlog.id)}
                    className="bg-red-600 px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================= CINEMATIC MODAL ================= */}
        {activeVlog && scenes.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* BLURRED BACKGROUND */}
            <div
              className="absolute inset-0 blur-2xl scale-110"
              style={{
                backgroundImage: `url(${current?.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            <div className="absolute inset-0 bg-black/70" />

            {/* CONTENT */}
            <div className="relative z-10">

              {/* CLOSE */}
              <button
                className="absolute top-[-50px] right-0 text-2xl"
                onClick={() => setActiveVlog(null)}
              >
                ✕
              </button>

              {/* PLAYER */}
              <div className="relative w-[700px] h-[450px] overflow-hidden rounded-xl">

                {/* IMAGE */}
                <img
                  key={sceneIndex}
                  src={current?.image}
                  className="w-full h-full object-cover animate-[zoom_4s_ease-in-out]"
                />

                {/* GRADIENT */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* TEXT */}
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-sm text-gray-300">
                    Scene {sceneIndex % scenes.length + 1} / {scenes.length}
                  </p>

                  <p className="text-lg leading-relaxed">
                    {current?.voiceover}
                  </p>
                </div>
              </div>

              {/* CONTROLS */}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() =>
                    setSceneIndex((prev) =>
                      prev === 0 ? scenes.length - 1 : prev - 1
                    )
                  }
                  className="bg-gray-700 px-4 py-2 rounded"
                >
                  ◀ Prev
                </button>

                <button
                  onClick={() =>
                    setSceneIndex((prev) =>
                      prev === scenes.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="bg-gray-700 px-4 py-2 rounded"
                >
                  Next ▶
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}