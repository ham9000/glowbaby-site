import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#141218",
          borderRadius: "18px",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#f3b65c",
            borderRadius: "999px",
            display: "flex",
            height: "28px",
            position: "relative",
            width: "28px",
          }}
        >
          <div
            style={{
              background: "#141218",
              borderRadius: "999px",
              display: "flex",
              height: "28px",
              left: "9px",
              position: "absolute",
              top: "-4px",
              width: "28px",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
