import { useState, useEffect } from "react";
import { 
  supabase, 
  isUsingMock, 
  mockEmitter,
  fetchRaceById, 
  fetchRaceParticipants, 
  fetchRacePositions,
} from "../lib/supabase";
import type { Race, RaceParticipant, RacePosition } from "../lib/supabase";

export function useRaceRealtime(raceId: string | undefined) {
  const [race, setRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [positions, setPositions] = useState<RacePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    const rId = raceId;
    if (!rId) return;

    let isMounted = true;

    async function loadInitialData() {
      if (!rId) return;
      setLoading(true);
      try {
        const [raceData, partData, posData] = await Promise.all([
          fetchRaceById(rId),
          fetchRaceParticipants(rId),
          fetchRacePositions(rId)
        ]);

        if (isMounted) {
          setRace(raceData);
          setParticipants(partData);
          setPositions(posData);
          setError(null);
        }
      } catch (err: any) {
        console.error("Error loading initial race details:", err);
        if (isMounted) {
          setError(err.message || "Failed to load race setup");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [raceId]);

  // 2. Real-time Subscription (Real Supabase OR Mock Emitter)
  useEffect(() => {
    const rId = raceId;
    if (!rId) return;

    // --- MOCK MODE SUBSCRIBER ---
    if (isUsingMock) {
      const unsubStatus = mockEmitter.subscribe(`race_status_changed_${rId}`, (data: { status: any; finished_at?: string; started_at?: string }) => {
        setRace(prev => prev ? { ...prev, ...data } : null);
      });

      const unsubParticipants = mockEmitter.subscribe(`participants_changed_${rId}`, (updatedParticipants: RaceParticipant[]) => {
        setParticipants(updatedParticipants);
      });

      const unsubPositions = mockEmitter.subscribe(`position_added_${rId}`, (newPos: RacePosition) => {
        setPositions(prev => {
          // Prevent duplicates
          if (prev.some(p => p.id === newPos.id)) return prev;
          return [...prev, newPos];
        });
      });

      return () => {
        unsubStatus();
        unsubParticipants();
        unsubPositions();
      };
    }

    // --- REAL SUPABASE SOCKET CHANNEL ---
    if (!supabase) return;

    const channel = supabase.channel(`race_live_${rId}`);

    channel
      // A. Listen to status updates in races table
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "races",
          filter: `id=eq.${rId}`
        },
        (payload) => {
          setRace(payload.new as Race);
        }
      )
      // B. Listen to participant updates (joins, completions, quits)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "race_participants",
          filter: `race_id=eq.${rId}`
        },
        async () => {
          // Refetch is safest for RLS updates to maintain relational fields
          const updatedParts = await fetchRaceParticipants(rId);
          setParticipants(updatedParts);
        }
      )
      // C. Listen to position changes
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "race_positions",
          filter: `race_id=eq.${rId}`
        },
        (payload) => {
          const newPos = payload.new as RacePosition;
          setPositions((prev) => {
            if (prev.some(p => p.id === newPos.id)) return prev;
            return [...prev, newPos];
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Realtime subscription channel error on race", rId);
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [raceId]);

  return {
    race,
    participants,
    positions,
    loading,
    error,
    refetchParticipants: async () => {
      const rId = raceId;
      if (rId) {
        const parts = await fetchRaceParticipants(rId);
        setParticipants(parts);
      }
    }
  };
}
