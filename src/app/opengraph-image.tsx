import { ImageResponse } from "next/og";
import { StrollerGraphic } from "@/components/stroller-graphic";

export const alt =
  "Glowbaby Stroller Light — app-controlled stroller lighting. Concept illustration of a bottom-mounted disc with LEDs around its edge casting a soft glow outward, around, and down beneath a stroller, with a separate controller; in development.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f8f7fb",
          color: "#141218",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          overflow: "hidden",
          padding: "58px 64px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#eeeafd",
            borderRadius: "999px",
            display: "flex",
            height: "640px",
            position: "absolute",
            right: "-110px",
            top: "-50px",
            width: "640px",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", width: "490px" }}>
          <div
            style={{
              color: "#5a0fea",
              display: "flex",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "1px",
            }}
          >
            APP-CONTROLLED STROLLER LIGHTING
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "sans-serif",
              fontWeight: 700,
              fontSize: "76px",
              letterSpacing: "-3.5px",
              lineHeight: 1.04,
              marginTop: "28px",
            }}
          >
            Glowbaby Stroller Light
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "30px",
              lineHeight: 1.25,
              marginTop: "30px",
            }}
          >
            <span>Made to be seen.</span>
            <span>Built to be theirs.</span>
          </div>
          <div style={{ color: "#5d5667", display: "flex", fontSize: "22px", marginTop: "22px" }}>
            For strollers and wagons.
          </div>
          <div
            style={{
              alignSelf: "flex-start",
              background: "#f5b4a4",
              borderRadius: "100px",
              display: "flex",
              fontSize: "17px",
              fontWeight: 700,
              marginTop: "24px",
              padding: "10px 18px",
            }}
          >
            In development
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(145deg, #252035, #141218 60%, #35176c)",
            borderRadius: "180px 210px 120px 160px",
            boxShadow: "0 24px 55px rgba(28,16,49,.16)",
            display: "flex",
            flexDirection: "column",
            height: "466px",
            justifyContent: "center",
            position: "relative",
            width: "526px",
          }}
        >
          {StrollerGraphic({ width: 526, height: 427 })}
          <div
            style={{
              bottom: "23px",
              color: "#e5dcfb",
              display: "flex",
              fontSize: "14px",
              justifyContent: "center",
              left: 0,
              position: "absolute",
              width: "100%",
            }}
          >
            Bottom-mounted disc + controller concept
          </div>
        </div>
      </div>
    ),
    size,
  );
}
