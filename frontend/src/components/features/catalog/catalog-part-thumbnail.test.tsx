import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CatalogPartThumbnail } from "./catalog-part-thumbnail";

describe("CatalogPartThumbnail CLS slot (CAT-01)", () => {
  it("reserves a fixed aspect-ratio media slot before image load", () => {
    render(
      <CatalogPartThumbnail
        family="switch"
        alt="Test switch"
        imageUrl="https://cdn.example.com/switch.png"
        uniformCardMedia
      />,
    );
    const slot = screen.getByTestId("e2e-catalog-media-slot");
    expect(slot).toHaveStyle({ aspectRatio: "4 / 3" });
    const img = slot.querySelector("img");
    expect(img).toHaveAttribute("width", "1200");
    expect(img).toHaveAttribute("height", "900");
  });
});
