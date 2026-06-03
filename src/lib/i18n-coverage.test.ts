import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SUPPORTED_LOCALES, translations } from "./i18n";

type TranslationNode = string | { [key: string]: TranslationNode };

const sourceRoots = ["src/components", "src/hooks", "src/routes"];

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) return walkFiles(path);
    if (/\.(tsx?|jsx?)$/.test(entry)) return [path];
    return [];
  });
}

function extractUsedKeys(): string[] {
  const keys = new Set<string>();
  const keyPattern = /\bt\("([^"]+)"|getTranslation\([^,]+,\s*"([^"]+)"/g;

  sourceRoots.flatMap(walkFiles).forEach((file) => {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(keyPattern)) {
      keys.add(match[1] || match[2]);
    }
  });

  return [...keys].sort();
}

function getNode(tree: TranslationNode, key: string): TranslationNode | undefined {
  return key.split(".").reduce<TranslationNode | undefined>((node, part) => {
    if (!node || typeof node === "string") return undefined;
    return node[part];
  }, tree);
}

function flattenKeys(tree: TranslationNode, prefix = ""): string[] {
  if (typeof tree === "string") return [prefix];
  return Object.entries(tree).flatMap(([key, value]) => flattenKeys(value, prefix ? `${prefix}.${key}` : key));
}

describe("i18n coverage", () => {
  it("translates every central i18n key used by app screens", () => {
    const usedKeys = extractUsedKeys();

    for (const locale of SUPPORTED_LOCALES) {
      const missing = usedKeys.filter((key) => typeof getNode(translations[locale], key) !== "string");
      expect(missing, `${locale} missing keys`).toEqual([]);
    }
  });

  it("keeps PT, EN and ES central translation trees in sync", () => {
    const referenceKeys = flattenKeys(translations.pt).sort();

    for (const locale of SUPPORTED_LOCALES) {
      const missing = referenceKeys.filter((key) => typeof getNode(translations[locale], key) !== "string");
      expect(missing, `${locale} missing keys`).toEqual([]);
    }
  });
});
