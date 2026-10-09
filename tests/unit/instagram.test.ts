import { describe, expect, it } from "vitest";
import { instagramPostUrl, invalidInstagramLines, parseInstagramPosts } from "@/lib/instagram";

describe("links de Instagram para «Quiénes somos»", () => {
  it("normaliza publicaciones y reels, con o sin parámetros", () => {
    expect(instagramPostUrl("https://www.instagram.com/p/DAbc_12-x/?igsh=xyz")).toBe("https://www.instagram.com/p/DAbc_12-x/");
    expect(instagramPostUrl("instagram.com/reel/C9zz/")).toBeNull();
    expect(instagramPostUrl("https://instagram.com/solis_racingparts/reel/C9zz")).toBe("https://www.instagram.com/reel/C9zz/");
    expect(instagramPostUrl("https://www.instagram.com/solis_racingparts/")).toBeNull();
    expect(instagramPostUrl('https://www.instagram.com/p/x"><script>')).toBe("https://www.instagram.com/p/x/");
  });

  it("lee una publicación por línea con título y etiqueta opcionales, sin repetir", () => {
    const posts = parseInstagramPosts(
      [
        "https://www.instagram.com/p/AAA/ | Seteo FuelTech FT550 | Honda Civic 1998",
        "",
        "https://www.instagram.com/reel/BBB/",
        "https://www.instagram.com/p/AAA/?img_index=2",
        "esto no es un link",
      ].join("\n"),
    );
    expect(posts).toEqual([
      { url: "https://www.instagram.com/p/AAA/", title: "Seteo FuelTech FT550", tag: "Honda Civic 1998" },
      { url: "https://www.instagram.com/reel/BBB/", title: "", tag: "" },
    ]);
  });

  it("avisa las líneas que no son publicaciones", () => {
    expect(invalidInstagramLines("https://www.instagram.com/p/AAA/\n\nhttps://www.instagram.com/solis_racingparts/")).toEqual([
      "https://www.instagram.com/solis_racingparts/",
    ]);
  });
});
