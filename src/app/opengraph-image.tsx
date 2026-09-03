import { ImageResponse } from "next/og";

export const alt = "Glowbaby — A softer start to every night";
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
          background: "#f7f1e7",
          color: "#1c2923",
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
            background: "#f3c5a6",
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
              fontFamily: "serif",
              fontSize: "94px",
              letterSpacing: "-5px",
              lineHeight: 0.92,
              marginTop: "52px",
            }}
          >
            A softer start to every night.
          </div>
          <div style={{ display: "flex", fontSize: "22px", marginTop: "38px", opacity: 0.6 }}>
            Thoughtful care, after dark.
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "#fffaf0",
            borderRadius: "48% 52% 46% 54%",
            boxShadow: "0 30px 60px rgba(28,41,35,.18)",
            display: "flex",
            height: "300px",
            justifyContent: "center",
            position: "relative",
            width: "260px",
            zIndex: 3,
          }}
        >
          <div
            style={{
              background: "#f3b65c",
              borderRadius: "999px",
              display: "flex",
              height: "74px",
              position: "relative",
              width: "74px",
            }}
          >
            <div
              style={{
                background: "#fffaf0",
                borderRadius: "999px",
                display: "flex",
                height: "74px",
                left: "27px",
                position: "absolute",
                top: "-8px",
                width: "74px",
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
