import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";
export const alt =
  "ZeilaLink — jobs, training, workers, services, and businesses";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: "#f8fbff",
          color: "#0f172a",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 85% 20%, rgba(31,127,233,0.24), transparent 32%), radial-gradient(circle at 8% 90%, rgba(31,127,233,0.13), transparent 30%)",
          }}
        />
        <div
          style={{
            width: 1050,
            height: 500,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "58px 66px",
            borderRadius: 40,
            border: "2px solid #d7e8fb",
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 30px 80px rgba(15,42,102,0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              color: "#1f7fe9",
              fontSize: 52,
              fontWeight: 850,
              letterSpacing: -2,
            }}
          >
            <span
              style={{
                display: "flex",
                width: 64,
                height: 64,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 18,
                background: "#1f7fe9",
                color: "#ffffff",
                fontSize: 36,
                fontWeight: 900,
              }}
            >
              Z
            </span>
            {SITE_NAME}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 19,
            }}
          >
            <div
              style={{
                display: "flex",
                maxWidth: 900,
                fontSize: 61,
                lineHeight: 1.06,
                fontWeight: 850,
                letterSpacing: -2.2,
              }}
            >
              Find work. Build skills. Grow together.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 27,
                color: "#35527a",
              }}
            >
              Hel shaqo • Baro xirfad • Kobci ganacsigaaga
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
