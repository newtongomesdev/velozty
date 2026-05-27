export type NotificationCapability = NotificationPermission | "not_supported";
export type WakeLockStatus = "active" | "supported" | "not_supported";

let wakeLockSentinel: WakeLockSentinel | null = null;

type WakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

export function getNotificationCapability(): NotificationCapability {
  if (!("Notification" in window)) return "not_supported";
  if (!("serviceWorker" in navigator)) return "not_supported";
  return Notification.permission;
}

export async function requestPwaNotifications(): Promise<NotificationCapability> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return "not_supported";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification("Velozty", {
    body: "Notificações PWA ativadas.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "velozty-notifications-enabled",
    silent: true,
  });

  return permission;
}

export function getWakeLockStatus(): WakeLockStatus {
  if (!("wakeLock" in navigator)) return "not_supported";
  return wakeLockSentinel && !wakeLockSentinel.released ? "active" : "supported";
}

export async function requestScreenWakeLock(): Promise<WakeLockStatus> {
  const nav = navigator as NavigatorWithWakeLock;
  if (!nav.wakeLock?.request) return "not_supported";

  if (wakeLockSentinel && !wakeLockSentinel.released) return "active";

  wakeLockSentinel = await nav.wakeLock.request("screen");
  wakeLockSentinel.addEventListener("release", () => {
    wakeLockSentinel = null;
  });

  return "active";
}

export async function releaseScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel && !wakeLockSentinel.released) {
    await wakeLockSentinel.release();
  }
  wakeLockSentinel = null;
}

export async function showRaceNotification(title: string, body: string): Promise<void> {
  if (getNotificationCapability() !== "granted") return;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: `velozty-${Date.now()}`,
  });
}
