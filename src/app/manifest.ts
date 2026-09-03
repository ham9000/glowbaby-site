import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glowbaby",
    short_name: "Glowbaby",
    description: "A softer start to every night.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e7",
    theme_color: "#f7f1e7",
  };
}
