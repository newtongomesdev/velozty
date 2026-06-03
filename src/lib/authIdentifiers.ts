export function normalizeLoginIdentifier(rawValue: string): { kind: "email" | "username"; value: string } {
  const value = rawValue.trim();
  if (value.includes("@") && !value.startsWith("@")) {
    return { kind: "email", value: value.toLowerCase() };
  }

  return {
    kind: "username",
    value: value.replace(/^@+/, ""),
  };
}
