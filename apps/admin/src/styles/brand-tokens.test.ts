/// <reference types="node" />
import { emerald, gold, roles, teal } from "@tamva/brand";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Read as text: Vitest replaces imported CSS modules with an empty string.
const css = readFileSync(resolve(process.cwd(), "src/styles/global.css"), "utf8");


// Admin maps the shared TAMVA palette onto CSS variables. If someone edits either
// side alone, this fails, so Admin and Mobile cannot drift into different brands.
const light = css.slice(0, css.indexOf(".dark"));
const dark = css.slice(css.indexOf(".dark"));
const value = (block: string, name: string) =>
  block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

describe("Admin colours come from the shared brand tokens", () => {
  it("uses deep teal as the primary in both themes", () => {
    expect(value(light, "brand-primary")).toBe(roles.light.primary.toLowerCase());
    expect(value(light, "brand-primary-hover")).toBe(roles.light.primaryHover.toLowerCase());
    expect(value(dark, "brand-primary")).toBe(roles.dark.primary.toLowerCase());
    expect(value(dark, "brand-primary-hover")).toBe(roles.dark.primaryHover.toLowerCase());
    expect(value(dark, "brand-on-primary")).toBe(roles.dark.primaryOn.toLowerCase());
    expect(roles.light.primary).toBe(teal[600]);
  });

  it("keeps gold as the accent and emerald as the secondary, not the primary", () => {
    expect(value(light, "accent-gold")).toBe(gold[500].toLowerCase());
    expect(value(light, "accent-gold-text")).toBe(gold[700].toLowerCase());
    expect(value(light, "accent-emerald")).toBe(emerald[600].toLowerCase());
    expect(value(light, "brand-primary")).not.toBe(value(light, "accent-gold"));
  });
});
