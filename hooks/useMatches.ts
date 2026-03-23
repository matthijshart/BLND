"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUser } from "@/lib/db";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { Match, User } from "@/types";

export interface MatchWithProfile extends Match {
  otherUser: User;
}

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

        for (const doc of snap.docs) {
          const match = { id: doc.id, ...doc.data() } as Match;
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

        // Sort client-side: newest first
        matchesWithProfiles.sort((a, b) => {
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
