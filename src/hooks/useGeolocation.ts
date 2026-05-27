import { useState, useEffect, useRef, useCallback } from "react";
import { detectLocale, getTranslation, LOCALE_STORAGE_KEY } from "../lib/i18n";
import { haversineDistance, kmhFromMetersPerSecond } from "../lib/geo";

export interface GeolocationPositionData {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number; // in km/h
  timestamp: number;
}

interface UseGeolocationOptions {
  finishLat: number;
  finishLng: number;
  finishRadiusM: number;
  onPositionReceived?: (data: GeolocationPositionData, distanceToFinish: number) => void;
  onFinishReached?: (totalTimeMs: number, topSpeedKmh: number) => void;
  enabled?: boolean;
}

export function useGeolocation({
  finishLat,
  finishLng,
  finishRadiusM,
  onPositionReceived,
  onFinishReached,
  enabled = false,
}: UseGeolocationOptions) {
  const [isSupported, setIsSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPositionData | null>(null);
  const [topSpeed, setTopSpeed] = useState(0);
  const [distanceToFinish, setDistanceToFinish] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"searching" | "accurate" | "poor" | "off">("off");
  
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeolocationPositionData | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number | null>(null);
  const accumulatedTopSpeedRef = useRef<number>(0);
  
  const lowSpeedStreakRef = useRef<number>(0);
  const pausedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const emaLatRef = useRef<number | null>(null);
  const emaLngRef = useRef<number | null>(null);
  
  // Verify support
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsSupported(false);
      setGpsStatus("off");
    }
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setIsPaused(false);
    setGpsStatus("off");
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    pauseTimeRef.current = Date.now();
    setGpsStatus("poor");
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    if (pauseTimeRef.current !== null) {
      totalPausedTimeRef.current += Date.now() - pauseTimeRef.current;
      pauseTimeRef.current = null;
    }
    setGpsStatus("searching");
  }, []);

  const handleGeolocationUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude: rawLat, longitude: rawLng, accuracy, speed: nativeSpeedMps } = position.coords;
    const timestamp = position.timestamp;

    // 1. GPS Filtering: Ignore extremely poor accuracy readings (drift prevention)
    const maxAccuracy = localStorage.getItem("velocity_gps_accuracy") === "standard" ? 50 : 30;
    if (accuracy > maxAccuracy) {
      setGpsStatus("poor");
      return;
    }

    // Check GPS Signal Status
    if (accuracy < 15) {
      setGpsStatus("accurate");
    } else {
      setGpsStatus("searching");
    }

    // 2. Exponential Moving Average (EMA) Coordinate Smoothing (Alpha configured or fallback to 0.35)
    let lat = rawLat;
    let lng = rawLng;
    const alphaSetting = localStorage.getItem("velocity_gps_smoothing");
    const alpha = alphaSetting === "off" ? 1.0 : parseFloat(alphaSetting || "0.35");

    if (emaLatRef.current !== null && emaLngRef.current !== null) {
      lat = alpha * rawLat + (1 - alpha) * emaLatRef.current;
      lng = alpha * rawLng + (1 - alpha) * emaLngRef.current;
    }
    emaLatRef.current = lat;
    emaLngRef.current = lng;

    let speedKmh = 0;
    
    // Speed Calculation with Fallback
    if (nativeSpeedMps !== null && nativeSpeedMps !== undefined && nativeSpeedMps >= 0) {
      speedKmh = kmhFromMetersPerSecond(nativeSpeedMps);
    } else if (lastPositionRef.current) {
      // Manual speed calculation if device GPS doesn't report velocity directly
      const timeDeltaSeconds = (timestamp - lastPositionRef.current.timestamp) / 1000;
      if (timeDeltaSeconds > 0.5) {
        const distanceMeters = haversineDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          lat,
          lng
        );
        // Exclude stationary noise
        if (distanceMeters > 1) {
          speedKmh = (distanceMeters / timeDeltaSeconds) * 3.6;
        }
      }
    }

    // Limit extreme calculation spikes (e.g. cellular drift speed spikes)
    if (speedKmh > 120) {
      speedKmh = lastPositionRef.current?.speed || 0;
    }

    // 3. Intelligent Auto-Pause / Auto-Resume
    const autoPauseLimit = parseFloat(localStorage.getItem("velocity_gps_autopause_speed") || "1.2");
    const autoResumeLimit = autoPauseLimit * 2; // e.g. 2.4 km/h if pause is 1.2 km/h

    if (isPaused) {
      // Check Auto-Resume triggers: Speed > autoResumeLimit or moved > 8m from pause coordinates
      let shouldResume = speedKmh > autoResumeLimit;
      
      if (!shouldResume && pausedCoordsRef.current) {
        const distFromPaused = haversineDistance(
          pausedCoordsRef.current.lat,
          pausedCoordsRef.current.lng,
          lat,
          lng
        );
        if (distFromPaused > 8) {
          shouldResume = true;
        }
      }

      if (shouldResume) {
        resume();
        pausedCoordsRef.current = null;
        lowSpeedStreakRef.current = 0;
      } else {
        // Still paused, skip updating telemetry
        return;
      }
    } else {
      // Check Auto-Pause triggers: Speed < autoPauseLimit for 5 consecutive updates (approx 5s)
      if (speedKmh < autoPauseLimit) {
        lowSpeedStreakRef.current += 1;
        if (lowSpeedStreakRef.current >= 5) {
          pause();
          pausedCoordsRef.current = { lat, lng };
          return;
        }
      } else {
        lowSpeedStreakRef.current = 0;
      }
    }

    // Update Peak Speed
    if (speedKmh > accumulatedTopSpeedRef.current) {
      accumulatedTopSpeedRef.current = speedKmh;
      setTopSpeed(speedKmh);
    }

    // Distance to arrival
    const dist = haversineDistance(lat, lng, finishLat, finishLng);
    setDistanceToFinish(dist);

    const positionData: GeolocationPositionData = {
      lat,
      lng,
      accuracy,
      speed: speedKmh,
      timestamp
    };

    setCurrentPosition(positionData);
    lastPositionRef.current = positionData;

    if (onPositionReceived) {
      onPositionReceived(positionData, dist);
    }

    // Check Finish Line detection
    if (dist <= finishRadiusM) {
      stop();
      const elapsedMs = startTimeRef.current 
        ? Date.now() - startTimeRef.current - totalPausedTimeRef.current 
        : 0;
      if (onFinishReached) {
        onFinishReached(elapsedMs, accumulatedTopSpeedRef.current);
      }
    }
  }, [finishLat, finishLng, finishRadiusM, isPaused, stop, pause, resume, onPositionReceived, onFinishReached]);

  const handleGeolocationError = useCallback((error: GeolocationPositionError) => {
    console.error("GPS Watch Position Error:", error);
    const locale = detectLocale(localStorage.getItem(LOCALE_STORAGE_KEY) || navigator.language);
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setPermissionError(getTranslation(locale, "geolocation.denied"));
        break;
      case error.POSITION_UNAVAILABLE:
        setPermissionError(getTranslation(locale, "geolocation.unavailable"));
        break;
      case error.TIMEOUT:
        setPermissionError(getTranslation(locale, "geolocation.timeout"));
        break;
      default:
        setPermissionError(getTranslation(locale, "geolocation.unknown"));
        break;
    }
    setGpsStatus("off");
  }, []);

  const start = useCallback(() => {
    if (!isSupported) return;
    setPermissionError(null);
    setIsTracking(true);
    setIsPaused(false);
    setTopSpeed(0);
    accumulatedTopSpeedRef.current = 0;
    startTimeRef.current = Date.now();
    totalPausedTimeRef.current = 0;
    pauseTimeRef.current = null;
    lastPositionRef.current = null;
    lowSpeedStreakRef.current = 0;
    pausedCoordsRef.current = null;
    emaLatRef.current = null;
    emaLngRef.current = null;
    setGpsStatus("searching");

    // Request GPS Sensor feed
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleGeolocationUpdate,
      handleGeolocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [isSupported, handleGeolocationUpdate, handleGeolocationError]);

  // Handle auto start based on enabled trigger
  useEffect(() => {
    if (enabled && !isTracking) {
      start();
    } else if (!enabled && isTracking) {
      stop();
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled, start, stop, isTracking]);

  return {
    isSupported,
    permissionError,
    isTracking,
    isPaused,
    currentPosition,
    topSpeed,
    distanceToFinish,
    gpsStatus,
    start,
    pause,
    resume,
    stop
  };
}
