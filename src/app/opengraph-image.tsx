import { ImageResponse } from "next/og";

export const alt = "Glowbaby — Made to be seen. Built to be theirs.";
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
          padding: "72px 80px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#e3dcff",
            borderRadius: "999px",
            display: "flex",
            height: "520px",
            position: "absolute",
            right: "-70px",
            top: "-60px",
            width: "520px",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "720px", zIndex: 2 }}>
          <div style={{ display: "flex", fontSize: "28px", fontWeight: 700 }}>
            Glowbaby
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "sans-serif",
              fontWeight: 600,
              fontSize: "94px",
              letterSpacing: "-3px",
              lineHeight: 1.02,
              marginTop: "52px",
            }}
          >
            Made to be seen. Built to be theirs.
          </div>
          <div style={{ display: "flex", fontSize: "22px", marginTop: "38px", opacity: 0.6 }}>
            Modular, app-controlled lighting for family gear.
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(145deg, #fffdf8, #c5ccc7)",
            borderRadius: "58% 52% 22% 20% / 62% 57% 36% 28%",
            boxShadow: "0 30px 60px rgba(28,41,35,.18)",
            display: "flex",
            height: "250px",
            justifyContent: "center",
            position: "relative",
            width: "340px",
            zIndex: 3,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#141218",
              borderRadius: "999px",
              bottom: "34px",
              display: "flex",
              gap: "13px",
              height: "34px",
              justifyContent: "center",
              left: "22px",
              position: "relative",
              width: "295px",
            }}
          >
            {["#45d4df", "#7657e8", "#ef8168", "#b5e85c", "#45d4df", "#7657e8", "#ef8168"].map(
              (color, index) => (
                <span
                  key={`${color}-${index}`}
                  style={{
                    background: color,
                    borderRadius: "999px",
                    boxShadow: `0 0 12px ${color}`,
                    display: "flex",
                    height: "12px",
                    width: "12px",
                  }}
                />
              ),
            )}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
