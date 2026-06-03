import { describe, expect, it } from "vitest";
import { normalizeLoginIdentifier } from "./authIdentifiers";

describe("auth identifiers", () => {
  it("normalizes email identifiers", () => {
    expect(normalizeLoginIdentifier(" Test@Email.com ")).toEqual({
      kind: "email",
      value: "test@email.com",
    });
  });

  it("normalizes username identifiers with or without @", () => {
    expect(normalizeLoginIdentifier("@Racer.Test")).toEqual({
      kind: "username",
      value: "Racer.Test",
    });
    expect(normalizeLoginIdentifier("racer_test")).toEqual({
      kind: "username",
      value: "racer_test",
    });
  });
});
