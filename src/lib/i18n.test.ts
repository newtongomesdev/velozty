import { describe, expect, it } from "vitest";
import { detectLocale, getTranslation } from "./i18n";

describe("detectLocale", () => {
  it("normaliza idiomas suportados automaticamente", () => {
    expect(detectLocale("en-US")).toBe("en");
    expect(detectLocale("es-MX")).toBe("es");
    expect(detectLocale("pt-BR")).toBe("pt");
  });

  it("faz fallback para português quando o idioma não é suportado", () => {
    expect(detectLocale("fr-FR")).toBe("pt");
    expect(detectLocale(undefined)).toBe("pt");
  });
});

describe("getTranslation", () => {
  it("usa a tradução do idioma detectado", () => {
    expect(getTranslation("en", "app.slogan")).toBe("Create races. Challenge friends. Finish first.");
    expect(getTranslation("es", "common.back")).toBe("Volver");
  });

  it("faz fallback para português quando faltar chave no idioma ativo", () => {
    expect(getTranslation("en", "missing.key")).toBe("missing.key");
  });
});
