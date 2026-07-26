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

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #07152f 0%, #102a66 54%, #1f7fe9 100%)",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 999,
            top: -230,
            right: -120,
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.16)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 410,
            height: 410,
            borderRadius: 999,
            bottom: -250,
            left: 160,
            background: "rgba(89,184,255,0.18)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "72px 78px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: 58,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            <span
              style={{
                display: "flex",
                width: 68,
                height: 68,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                background: "#ffffff",
                color: "#1f7fe9",
                fontSize: 38,
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
              maxWidth: 990,
              gap: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 66,
                lineHeight: 1.04,
                fontWeight: 850,
                letterSpacing: -2.5,
              }}
            >
              Opportunity, skills, and trusted connections.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 29,
                lineHeight: 1.3,
                color: "#d8eaff",
              }}
            >
              Shaqooyin • Shaqaale • Tababaro • Adeegyo • Ganacsiyo
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
