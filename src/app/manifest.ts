import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glowbaby",
    short_name: "Glowbaby",
    description: "Modular, app-controlled lighting for family gear.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7fb",
    theme_color: "#5a0fea",
  };
}
