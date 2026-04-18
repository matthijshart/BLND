"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUser } from "@/lib/db";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { Match, User } from "@/types";

export interface MatchWithProfile extends Match {
  otherUser: User;
}

/**
 * Hook returning the current user's blends.
 * Automatically expires matches older than 3 days that never got a confirmed date.
 * Hides expired/cancelled matches from the list.
 */
export function useMatches() {
  const { firebaseUser } = useAuthContext();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    // No orderBy to avoid needing a composite index
    const q = query(
      collection(db, "matches"),
      where("users", "array-contains", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        const profileCache: Record<string, User> = {};
        const matchesWithProfiles: MatchWithProfile[] = [];
        const now = Date.now();

        for (const document of snap.docs) {
          const match = { id: document.id, ...document.data() } as Match;

          // Hide already-expired/cancelled matches from the list
          if (match.status === "expired" || match.status === "cancelled") {
            continue;
          }

          // Auto-expire stale matches: still in scheduling/proposed after the expiresAt date
          const expiresAtMs = match.expiresAt?.toMillis?.();
          const isStaleScheduling =
            (match.status === "scheduling" || match.status === "date_proposed") &&
            expiresAtMs &&
            expiresAtMs < now;

          if (isStaleScheduling) {
            // Fire-and-forget: update the server so future reads agree.
            // Don't await — don't block the UI on this.
            updateDoc(doc(db, "matches", match.id), { status: "expired" }).catch(() => {
              // If another client beat us to it, that's fine.
            });
            continue; // Don't show it in the list anymore
          }

          const otherUid = match.users.find((uid) => uid !== firebaseUser.uid);
          if (!otherUid) continue;

          if (!profileCache[otherUid]) {
            const profile = await getUser(otherUid);
            if (profile) profileCache[otherUid] = profile;
          }

          if (profileCache[otherUid]) {
            matchesWithProfiles.push({
              ...match,
              otherUser: profileCache[otherUid],
            });
          }
        }

        // Sort: action-required first, then by recency
        // Priority: date_proposed (need to confirm) > scheduling (need to plan) > others > date_confirmed (planned) > second_cup
        const statusPriority: Record<string, number> = {
          date_proposed: 0,
          scheduling: 1,
          second_cup: 2,
          date_confirmed: 3,
          completed: 4,
        };

        matchesWithProfiles.sort((a, b) => {
          const aPrio = statusPriority[a.status] ?? 99;
          const bPrio = statusPriority[b.status] ?? 99;
          if (aPrio !== bPrio) return aPrio - bPrio;
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setMatches(matchesWithProfiles);
        setLoading(false);
      },
      (error) => {
        console.error("Matches query error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseUser]);

  return { matches, loading };
}
