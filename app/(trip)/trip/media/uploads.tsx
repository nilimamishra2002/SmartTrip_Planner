"use client";

import { useState } from "react";

interface Props {
  email?: string;
  name?: string;
  tripPlanId: string | null;
  onUploadSuccess?: () => void;
}

export default function FileUploader({
  email,
  name,
  tripPlanId,
  onUploadSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !tripPlanId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tripPlanId", tripPlanId);

    setLoading(true);

    await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    setLoading(false);
    setFile(null);

    onUploadSuccess?.();
  };

  return (
    <div className="flex gap-3 items-center">
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setFile(e.target.files?.[0] || null)
        }
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}