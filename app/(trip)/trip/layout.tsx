// app/(trip)/trip/layout.tsx
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "SmartTrip",
  description: "Smart travel planner",
};

export default function TripLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
