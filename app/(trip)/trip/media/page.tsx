"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import FileUploader from "./uploads";

export default function MediaPage() {
  const searchParams = useSearchParams();
  const tripPlanId = searchParams.get("tripPlanId");
  const { data: session } = useSession();

  const [photos, setPhotos] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  /* ================= FETCH ================= */
  const fetchPhotos = async () => {
    if (!tripPlanId) return;

    const res = await fetch(`/api/media/list?tripPlanId=${tripPlanId}`);
    const data = await res.json();
    setPhotos(data.photos || []);
  };

  useEffect(() => {
    fetchPhotos();
  }, [tripPlanId]);

  /* ================= DELETE ================= */
  const deletePhoto = async (id: string) => {
    await fetch("/api/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId: id }),
    });

    fetchPhotos();
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📸 Trip Media</h2>
        </div>

        {/* UPLOADER */}
        <div className="bg-slate-900 p-4 rounded-xl">
          <FileUploader
            email={session?.user?.email || ""}
            name={session?.user?.name || ""}
            tripPlanId={tripPlanId}
            onUploadSuccess={fetchPhotos}
          />
        </div>

        {/* EMPTY */}
        {photos.length === 0 ? (
          <p className="text-gray-400">No media uploaded yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-slate-800 rounded-xl overflow-hidden"
              >
                {/* IMAGE */}
                <img
                  src={photo.url}
                  className="w-full h-48 object-cover"
                />

                {/* FOOTER */}
                <div className="p-3 space-y-2">

                  {/* ACTIONS */}
                  <div className="flex gap-2">

                    {/* WATCH */}
                    <button
                      onClick={() => setActiveImage(photo.url)}
                      className="bg-indigo-600 px-3 py-1 rounded text-sm"
                    >
                      Watch
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="bg-red-600 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>

                  </div>
                </div>
              </div>
            ))}

          </div>
        )}

        {/* ================= FULL VIEW MODAL ================= */}
        {activeImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* BLUR BG */}
            <div
              className="absolute inset-0 blur-2xl scale-110"
              style={{
                backgroundImage: `url(${activeImage})`,
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
                onClick={() => setActiveImage(null)}
              >
                ✕
              </button>

              {/* IMAGE */}
              <img
                src={activeImage}
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
              />

            </div>
          </div>
        )}

      </div>
    </div>
  );
}