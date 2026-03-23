"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import {
  getDailyDoc,
  createDailyDoc,
  markProfileAction,
  completeDailyBatch,
  fetchCandidateProfiles,
} from "@/lib/daily";
import { recordSwipe } from "@/lib/db";
import { getUser } from "@/lib/db";
import type { User } from "@/types";

export function useDailyProfiles() {
  const { firebaseUser, profile } = useAuthContext();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    if (!firebaseUser || !profile) return;

    setLoading(true);
    try {
      const dailyDoc = await getDailyDoc(firebaseUser.uid);

      if (dailyDoc?.completedAt) {
        setIsComplete(true);
        setLoading(false);
        return;
      }

      if (dailyDoc) {
        // Resume existing batch
        const seen = [...(dailyDoc.liked || []), ...(dailyDoc.passed || [])];
        const remaining = (dailyDoc.profiles as string[]).filter(
          (uid: string) => !seen.includes(uid)
        );

        if (remaining.length === 0) {
          setIsComplete(true);
          setLoading(false);
          return;
        }

        // Fetch full profiles for remaining UIDs
        const fullProfiles = await Promise.all(
          remaining.map((uid: string) => getUser(uid))
        );
        setProfiles(fullProfiles.filter(Boolean) as User[]);
      } else {
        // Create new daily batch
        const candidates = await fetchCandidateProfiles(
          firebaseUser.uid,
          profile.genderPreference || [],
          10
        );

        if (candidates.length === 0) {
          setIsComplete(true);
          setLoading(false);
          return;
        }

        const uids = candidates.map((c) => c.uid);
        await createDailyDoc(firebaseUser.uid, uids);
        setProfiles(candidates);
      }
    } catch (err) {
      console.error("Error loading daily profiles:", err);
    }
    setLoading(false);
  }, [firebaseUser, profile]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  async function handleAction(action: "like" | "pass") {
    if (!firebaseUser || currentIndex >= profiles.length) return;

    const targetProfile = profiles[currentIndex];
    const date = new Date().toISOString().split("T")[0];

    // Record swipe and mark action in parallel
    await Promise.all([
      recordSwipe(firebaseUser.uid, targetProfile.uid, action, date),
      markProfileAction(firebaseUser.uid, targetProfile.uid, action),
    ]);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= profiles.length) {
      await completeDailyBatch(firebaseUser.uid);
      setIsComplete(true);
    } else {
      setCurrentIndex(nextIndex);
    }

    return targetProfile.uid;
  }

  return {
    profiles,
    currentProfile: profiles[currentIndex] || null,
    currentIndex,
    total: profiles.length,
    isComplete,
    loading,
    handleAction,
  };
}
