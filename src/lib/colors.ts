/**
 * Neon color theme presets and assignment utilities.
 */

export const NEON_COLORS = [
  "#C6FF00", // Volt (Electric Green)
  "#FF2BD6", // Hyper Pink (Laser Crimson)
  "#00E5FF", // Neon Cyan
  "#FF6D00", // Neon Orange
  "#2979FF", // Electric Blue
  "#D500F9", // Hot Purple
  "#FFEA00", // Acid Yellow
  "#39FF14", // Lime Neon
];

export function getParticipantColor(index: number): string {
  return NEON_COLORS[index % NEON_COLORS.length];
}

export function getParticipantColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);
  return getParticipantColor(index);
}

/**
 * Returns a glow box shadow style for a given hex color.
 */
export function getGlowStyle(hexColor: string, opacity = 0.3) {
  // Convert hex to rgb
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return {
    borderColor: hexColor,
    boxShadow: `0 0 15px rgba(${r}, ${g}, ${b}, ${opacity})`,
  };
}
