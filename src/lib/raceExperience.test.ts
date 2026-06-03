import { describe, expect, it } from "vitest";
import {
  buildVoiceCoachMessage,
  createOfflineTelemetryQueue,
  getAdvancedRaceStats,
  getOrganizerRaceSummary,
} from "./raceExperience";
import type { RaceParticipant, RacePosition } from "./supabase";

const participants = [
  {
    id: "p1",
    race_id: "r1",
    user_id: "u1",
    display_name: "Ana",
    color: "#C6FF00",
    joined_at: "2026-06-02T10:00:00.000Z",
    started_at: "2026-06-02T10:01:00.000Z",
    finished_at: "2026-06-02T10:11:00.000Z",
    finish_time_ms: 600000,
    top_speed_kmh: 28,
    abandoned_at: null,
  },
  {
    id: "p2",
    race_id: "r1",
    user_id: "u2",
    display_name: "Bruno",
    color: "#FF2BD6",
    joined_at: "2026-06-02T10:00:00.000Z",
    started_at: "2026-06-02T10:01:00.000Z",
    finished_at: null,
    finish_time_ms: null,
    top_speed_kmh: 18,
    abandoned_at: "2026-06-02T10:08:00.000Z",
  },
] satisfies RaceParticipant[];

const positions = [
  { id: 1, race_id: "r1", participant_id: "p1", user_id: "u1", lat: 1, lng: 1, speed_kmh: 20, distance_to_finish_m: 300, recorded_at: "2026-06-02T10:02:00.000Z" },
  { id: 2, race_id: "r1", participant_id: "p1", user_id: "u1", lat: 1, lng: 1.001, speed_kmh: 28, distance_to_finish_m: 0, recorded_at: "2026-06-02T10:11:00.000Z" },
  { id: 3, race_id: "r1", participant_id: "p2", user_id: "u2", lat: 1, lng: 1.0005, speed_kmh: 18, distance_to_finish_m: 180, recorded_at: "2026-06-02T10:07:00.000Z" },
] satisfies RacePosition[];

describe("race experience helpers", () => {
  it("keeps offline telemetry queued until a flush succeeds", async () => {
    const queue = createOfflineTelemetryQueue();
    queue.enqueue({ race_id: "r1", participant_id: "p1", lat: 1, lng: 2, speed_kmh: 10, distance_to_finish_m: 20 });

    await expect(queue.flush(async () => {
      throw new Error("offline");
    })).resolves.toBe(0);
    expect(queue.size()).toBe(1);

    await expect(queue.flush(async () => undefined)).resolves.toBe(1);
    expect(queue.size()).toBe(0);
  });

  it("builds useful voice coach messages without exposing technical details", () => {
    expect(buildVoiceCoachMessage({ distanceToFinish: 80, rank: 1, totalParticipants: 4, speedKmh: 12 })).toContain("80 metros");
    expect(buildVoiceCoachMessage({ distanceToFinish: 900, rank: 2, totalParticipants: 5, speedKmh: 16 })).toContain("2º de 5");
  });

  it("summarizes organizer status for large groups", () => {
    expect(getOrganizerRaceSummary(participants, positions)).toMatchObject({
      total: 2,
      finished: 1,
      abandoned: 1,
      active: 0,
      leaderName: "Ana",
      topSpeedKmh: 28,
    });
  });

  it("computes advanced comparative stats", () => {
    expect(getAdvancedRaceStats(participants, positions)).toMatchObject({
      completionRate: 50,
      averageFinishTimeMs: 600000,
      fastestParticipantName: "Ana",
      topSpeedParticipantName: "Ana",
    });
  });
});

