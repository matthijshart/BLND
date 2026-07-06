import { ImageResponse } from "next/og";

/**
 * Branded Open Graph image — what shows up when someone shares bl-nd.nl
 * in WhatsApp, iMessage, LinkedIn, Slack. Generated at build time, so it
 * always matches the brand without maintaining a static asset.
 */
export const alt = "BLEND — Skip the chat. Meet for real.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Load DM Serif Display so the wordmark matches the brand. Falls back to
 * the default font if the fetch fails — a slightly-off OG image beats a
 * broken build.
 */
async function loadBrandFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap",
      // Ask for TTF (not woff2) — satori can't parse woff2
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; legacy)" } }
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const brandFont = await loadBrandFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#6b1520",
          position: "relative",
        }}
      >
        {/* Soft burgundy blobs, echoing the site hero */}
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -160,
            width: 480,
            height: 480,
            borderRadius: 9999,
            backgroundColor: "#862028",
            opacity: 0.4,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 340,
            height: 340,
            borderRadius: 9999,
            backgroundColor: "#862028",
            opacity: 0.3,
          }}
        />

        {/* The two overlapping circles — the logo */}
        <div style={{ display: "flex", marginBottom: 42 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 9999,
              backgroundColor: "#e8dfd1",
              opacity: 0.85,
            }}
          />
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 9999,
              backgroundColor: "#e8dfd1",
              opacity: 0.55,
              marginLeft: -32,
            }}
          />
        </div>

        <div
          style={{
            fontSize: 140,
            color: "#e8dfd1",
            fontFamily: brandFont ? "DM Serif Display" : "serif",
            letterSpacing: -2,
            display: "flex",
          }}
        >
          BLEND
        </div>

        <div
          style={{
            fontSize: 34,
            color: "rgba(232, 223, 209, 0.7)",
            marginTop: 28,
            display: "flex",
          }}
        >
          Skip the chat. Meet for real.
        </div>

        <div
          style={{
            fontSize: 19,
            color: "rgba(232, 223, 209, 0.4)",
            marginTop: 44,
            letterSpacing: 8,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Coffee dates · Amsterdam
        </div>
      </div>
    ),
    {
      ...size,
      fonts: brandFont
        ? [{ name: "DM Serif Display", data: brandFont, style: "normal" as const }]
        : undefined,
    }
  );
}
