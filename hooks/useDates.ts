"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { getUser } from "@/lib/db";
import type { DateRecord, User } from "@/types";

export interface DateWithProfile extends DateRecord {
  otherUser: User;
}

export function useDates() {
  const { firebaseUser } = useAuthContext();
  const [dates, setDates] = useState<DateWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "dates"),
      where("users", "array-contains", firebaseUser.uid),
      orderBy("dateTime", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const profileCache: Record<string, User> = {};
      const datesWithProfiles: DateWithProfile[] = [];

      for (const doc of snap.docs) {
        const dateRecord = { id: doc.id, ...doc.data() } as DateRecord & {
          caféName?: string;
          caféAddress?: string;
          caféVibe?: string;
          caféGoogleMapsUrl?: string;
        };
        const otherUid = dateRecord.users.find(
          (uid) => uid !== firebaseUser.uid
        );
        if (!otherUid) continue;

        if (!profileCache[otherUid]) {
          const profile = await getUser(otherUid);
          if (profile) profileCache[otherUid] = profile;
        }

        if (profileCache[otherUid]) {
          datesWithProfiles.push({
            ...dateRecord,
            otherUser: profileCache[otherUid],
          });
        }
      }

      setDates(datesWithProfiles);
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseUser]);

  return { dates, loading };
}
