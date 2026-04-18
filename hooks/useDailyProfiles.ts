"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import {
  getDailyDoc,
  createDailyDoc,
  markProfileAction,
  completeDailyBatch,
  fetchCandidateProfiles,
} from "@/lib/daily";
import { recordSwipe, getUser } from "@/lib/db";
import { checkForMatch, createMatch } from "@/lib/matching";
import type { User } from "@/types";

export interface SwipeResult {
  targetUid: string;
  matchedUid: string | null;
  matchId: string | null;
}

export function useDailyProfiles() {
  const { firebaseUser, profile } = useAuthContext();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastPassed, setLastPassed] = useState<User | null>(null);

  // Atomic lock — prevents double-tap from triggering multiple actions
  const actionInFlightRef = useRef(false);

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

        const fullProfiles = await Promise.all(
          remaining.map((uid: string) => getUser(uid))
        );
        setProfiles(fullProfiles.filter(Boolean) as User[]);
      } else {
        const candidates = await fetchCandidateProfiles(
          firebaseUser.uid,
          profile.genderPreference || [],
          10,
          profile
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

  /**
   * Process a like or pass atomically.
   * Returns the result including whether it created a match.
   * Subsequent calls while an action is in flight are ignored.
   */
  async function handleAction(action: "like" | "pass"): Promise<SwipeResult | null> {
    if (!firebaseUser || currentIndex >= profiles.length) return null;
    // Atomic lock — second rapid call is ignored
    if (actionInFlightRef.current) return null;
    actionInFlightRef.current = true;

    const targetProfile = profiles[currentIndex];
    const date = new Date().toISOString().split("T")[0];

    let matchedUid: string | null = null;
    let matchId: string | null = null;

    try {
      // Record swipe and mark action in parallel
      await Promise.all([
        recordSwipe(firebaseUser.uid, targetProfile.uid, action, date),
        markProfileAction(firebaseUser.uid, targetProfile.uid, action),
      ]);

      // Check for mutual match on likes only
      if (action === "like") {
        const isMatch = await checkForMatch(firebaseUser.uid, targetProfile.uid);
        if (isMatch) {
          matchId = await createMatch(firebaseUser.uid, targetProfile.uid);
          matchedUid = targetProfile.uid;
        }
      }

      // Track last pass for undo
      if (action === "pass") {
        setLastPassed(targetProfile);
      } else {
        setLastPassed(null);
      }

      // Advance to next profile
      const nextIndex = currentIndex + 1;
      if (nextIndex >= profiles.length) {
        await completeDailyBatch(firebaseUser.uid);
        setIsComplete(true);
      } else {
        setCurrentIndex(nextIndex);
      }

      return { targetUid: targetProfile.uid, matchedUid, matchId };
    } catch (err) {
      console.error("Action error:", err);
      return null;
    } finally {
      // Release lock after a small delay to absorb double-taps
      setTimeout(() => {
        actionInFlightRef.current = false;
      }, 300);
    }
  }

  /**
   * Undo the most recent pass. Steps back one index and clears the pass record.
   * Only works if the most recent action was a pass AND lock is free.
   */
  async function undoLastPass(): Promise<boolean> {
    if (!firebaseUser) return false;
    if (actionInFlightRef.current) return false;
    if (!lastPassed) return false;
    if (currentIndex === 0) return false;

    actionInFlightRef.current = true;
    try {
      const date = new Date().toISOString().split("T")[0];

      // Delete the most recent swipe record and remove from passed array
      const { db } = await import("@/lib/firebase");
      const { collection, query, where, getDocs, deleteDoc, doc, updateDoc, arrayRemove } = await import("firebase/firestore");

      const q = query(
        collection(db, "swipes"),
        where("swiperId", "==", firebaseUser.uid),
        where("swipedId", "==", lastPassed.uid),
        where("direction", "==", "pass")
      );
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

      // Remove from daily doc's `passed` array
      await updateDoc(
        doc(db, "users", firebaseUser.uid, "dailyProfiles", date),
        { passed: arrayRemove(lastPassed.uid) }
      );

      // Put the profile back at the current index
      setProfiles((prev) => {
        const updated = [...prev];
        updated.splice(currentIndex, 0, lastPassed);
        return updated;
      });
      // currentIndex stays, but now points to the restored profile
      setLastPassed(null);
      return true;
    } catch (err) {
      console.error("Undo error:", err);
      return false;
    } finally {
      actionInFlightRef.current = false;
    }
  }

  return {
    profiles,
    currentProfile: profiles[currentIndex] || null,
    currentIndex,
    total: profiles.length,
    isComplete,
    loading,
    lastPassed,
    handleAction,
    undoLastPass,
  };
}
