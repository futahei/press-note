import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeedbackIcon } from "@/components/Icons";

describe("FeedbackIcon", () => {
  it("defines the feedback mark paths directly in the adjusted position", () => {
    const markup = renderToStaticMarkup(<FeedbackIcon />);

    expect(markup).not.toContain("transform=");
    expect(markup).toContain('d="M21 10a8 8 0 0 1-8 8H6l-3 2 1.2-4.2A8 8 0 1 1 21 10Z"');
    expect(markup).toContain('d="M8 9h8"');
    expect(markup).toContain('d="M8 13h5"');
  });
});
