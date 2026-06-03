import { describe, expect, it } from "vitest";
import { sanitizeImageUrl, sanitizeText, sanitizeUrl } from "./sanitize";

describe("sanitize helpers", () => {
  it("removes control characters and enforces length", () => {
    expect(sanitizeText("  Olá\u0000 mundo\n\n<script>  ", 12)).toBe("Olá mundo <s");
  });

  it("blocks javascript and data URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("data:text/html,<svg onload=alert(1)>")).toBe("");
  });

  it("keeps safe http links with trimmed text", () => {
    expect(sanitizeUrl(" velozty.com/perfil ")).toBe("https://velozty.com/perfil");
    expect(sanitizeUrl("https://velozty.com/perfil")).toBe("https://velozty.com/perfil");
  });

  it("allows only safe image schemes", () => {
    expect(sanitizeImageUrl("blob:http://local/image")).toBe("blob:http://local/image");
    expect(sanitizeImageUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(sanitizeImageUrl("data:text/html;base64,abc")).toBe("");
  });
});
