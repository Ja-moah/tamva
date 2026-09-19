import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TamvaLogo, TamvaMark } from "./tamva-logo";

// No official files exist in packages/brand yet, so both components must fall
// back to an explicitly-flagged placeholder rather than a drawn logo.
describe("brand placeholders", () => {
  it("flags the mark as a placeholder and labels it accessibly", () => {
    render(<TamvaMark />);
    const mark = screen.getByRole("img", { name: "TAMVA" });
    expect(mark).toHaveAttribute("data-brand-placeholder", "true");
  });

  it("renders the full logo as plain-text product name, flagged as placeholder", () => {
    const { container } = render(<TamvaLogo surface="dark" />);
    const node = container.querySelector("[data-brand-placeholder]");
    expect(node).not.toBeNull();
    expect(node).toHaveTextContent("TAMVA");
    expect(container.querySelector("img")).toBeNull();
  });
});
