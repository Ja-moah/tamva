import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TamvaLogo, TamvaMark } from "./tamva-logo";

describe("tamva logo", () => {
  it("renders the mark with an accessible TAMVA label", () => {
    render(<TamvaMark />);
    expect(screen.getByRole("img", { name: "TAMVA" })).toBeInTheDocument();
  });

  it("renders a crest and wordmark lockup", () => {
    render(<TamvaLogo surface="dark" />);
    expect(screen.getByRole("img", { name: "TAMVA" })).toBeInTheDocument();
    expect(screen.getByText("TAMVA")).toBeInTheDocument();
  });
});
