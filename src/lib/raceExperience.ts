import type { RaceParticipant, RacePosition } from "./supabase";

export interface RaceTelemetryInput {
  race_id: string;
  participant_id: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  distance_to_finish_m: number;
}

export interface QueuedRaceTelemetry extends RaceTelemetryInput {
  queued_at: string;
}

export function createOfflineTelemetryQueue(initialItems: QueuedRaceTelemetry[] = []) {
  let items = [...initialItems];

  return {
    enqueue(input: RaceTelemetryInput) {
      items = [...items, { ...input, queued_at: new Date().toISOString() }];
    },
    items() {
      return [...items];
    },
    size() {
      return items.length;
    },
    async flush(sender: (input: RaceTelemetryInput) => Promise<void>) {
      const remaining: QueuedRaceTelemetry[] = [];
      let sent = 0;

      for (const item of items) {
        try {
          await sender(item);
          sent += 1;
        } catch {
          remaining.push(item);
        }
      }

      items = remaining;
      return sent;
    },
  };
}

export function getOrganizerRaceSummary(participants: RaceParticipant[], positions: RacePosition[]) {
  const finished = participants.filter((participant) => !!participant.finished_at).length;
  const abandoned = participants.filter((participant) => !!participant.abandoned_at).length;
  const active = participants.filter((participant) => !participant.finished_at && !participant.abandoned_at).length;
  const topSpeedKmh = Math.max(0, ...participants.map((participant) => Number(participant.top_speed_kmh || 0)));
  const sortedByFinish = [...participants].sort((a, b) => (a.finish_time_ms || Number.MAX_SAFE_INTEGER) - (b.finish_time_ms || Number.MAX_SAFE_INTEGER));
  const leader = sortedByFinish.find((participant) => participant.finished_at) || participants.find((participant) => !participant.abandoned_at) || participants[0];
  const latestPositionCount = new Set(positions.map((position) => position.participant_id)).size;

  return {
    total: participants.length,
    finished,
    abandoned,
    active,
    leaderName: leader?.display_name || "—",
    topSpeedKmh,
    latestPositionCount,
  };
}

export function getAdvancedRaceStats(participants: RaceParticipant[], positions: RacePosition[]) {
  const finishedParticipants = participants.filter((participant) => !!participant.finished_at && !!participant.finish_time_ms);
  const completionRate = participants.length > 0 ? Math.round((finishedParticipants.length / participants.length) * 100) : 0;
  const averageFinishTimeMs = finishedParticipants.length > 0
    ? Math.round(finishedParticipants.reduce((total, participant) => total + Number(participant.finish_time_ms || 0), 0) / finishedParticipants.length)
    : 0;
  const fastestParticipant = [...finishedParticipants].sort((a, b) => Number(a.finish_time_ms || 0) - Number(b.finish_time_ms || 0))[0];
  const topSpeedParticipant = [...participants].sort((a, b) => Number(b.top_speed_kmh || 0) - Number(a.top_speed_kmh || 0))[0];
  const totalTelemetryPoints = positions.length;

  return {
    completionRate,
    averageFinishTimeMs,
    fastestParticipantName: fastestParticipant?.display_name || "—",
    topSpeedParticipantName: topSpeedParticipant?.display_name || "—",
    topSpeedKmh: Number(topSpeedParticipant?.top_speed_kmh || 0),
    totalTelemetryPoints,
  };
}

export function buildVoiceCoachMessage(input: {
  distanceToFinish: number | null;
  rank: number;
  totalParticipants: number;
  speedKmh: number;
  opponentAheadDistance?: number | null;
  opponentAheadName?: string | null;
  locale?: string;
}) {
  const distance = input.distanceToFinish;
  const lang = input.locale || "pt";

  if (lang === "en") {
    if (distance !== null && distance <= 100) {
      return `Final stretch. ${Math.max(0, Math.round(distance))} meters remaining.`;
    }
    const speed = input.speedKmh > 0 ? `Current speed ${input.speedKmh.toFixed(1)} kilometers per hour.` : "Keep up the pace.";
    let status = `You are in position ${input.rank} out of ${input.totalParticipants}.`;
    if (input.opponentAheadDistance !== undefined && input.opponentAheadDistance !== null && input.opponentAheadName) {
      status += ` Rider ${input.opponentAheadName} is ${Math.round(input.opponentAheadDistance)} meters ahead.`;
    }
    return `${speed} ${status}`;
  } else if (lang === "es") {
    if (distance !== null && distance <= 100) {
      return `Recta final. Quedan ${Math.max(0, Math.round(distance))} metros.`;
    }
    const speed = input.speedKmh > 0 ? `Velocidad actual ${input.speedKmh.toFixed(1)} kilómetros por hora.` : "Mantén el ritmo.";
    let status = `Estás en la posición ${input.rank} de ${input.totalParticipants}.`;
    if (input.opponentAheadDistance !== undefined && input.opponentAheadDistance !== null && input.opponentAheadName) {
      status += ` El piloto ${input.opponentAheadName} está a ${Math.round(input.opponentAheadDistance)} metros adelante.`;
    }
    return `${speed} ${status}`;
  } else {
    // Portuguese default
    if (distance !== null && distance <= 100) {
      return `Reta final. Faltam ${Math.max(0, Math.round(distance))} metros.`;
    }
    const speed = input.speedKmh > 0 ? `Velocidade atual ${input.speedKmh.toFixed(1)} quilômetros por hora.` : "Mantenha o ritmo.";
    let status = `Você está em ${input.rank}º de ${input.totalParticipants}.`;
    if (input.opponentAheadDistance !== undefined && input.opponentAheadDistance !== null && input.opponentAheadName) {
      status += ` O piloto ${input.opponentAheadName} está a ${Math.round(input.opponentAheadDistance)} metros à frente.`;
    }
    return `${speed} ${status}`;
  }
}
