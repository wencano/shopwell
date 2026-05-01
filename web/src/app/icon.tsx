import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Serves `/icon` and default favicon so browsers stop probing missing `/favicon.ico`. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2d6a4f",
          color: "white",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
