import React, { useState, useRef } from "react";

interface ReportFormData {
  description: string;
  location: { latitude: number; longitude: number } | null;
  image: File | null;
}

export default function ReportForm() {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("idle");
      },
      () => {
        setLocationStatus("error");
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ReportFormData = { description, location, image };
    console.log("Report submitted:", data);
  };

  const isSubmitDisabled = description.trim().length === 0;

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-lg font-semibold text-neutral-100">Report an incident</h1>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-neutral-300">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what's happening"
            rows={4}
            className="w-full resize-none rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Location</span>
          <button
            type="button"
            onClick={handleShareLocation}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm font-medium px-3 py-2 transition-colors"
          >
            {locationStatus === "loading" ? (
              "Getting location..."
            ) : location ? (
              `Location shared (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
            ) : (
              "Share my GPS location"
            )}
          </button>
          {locationStatus === "error" && (
            <p className="text-xs text-red-400">
              Couldn't get your location. Check permissions and try again.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="image" className="text-sm font-medium text-neutral-300">
            Photo
          </label>
          <input
            ref={fileInputRef}
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-neutral-300 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-100 hover:file:bg-neutral-700 cursor-pointer"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Selected preview"
              className="mt-2 w-full max-h-40 object-cover rounded-lg border border-neutral-800"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-semibold text-sm px-3 py-2.5 transition-colors"
        >
          Submit report
        </button>
      </form>
    </div>
  );
}
