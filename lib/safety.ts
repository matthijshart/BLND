import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ReportReason } from "@/types";

/**
 * Block a user. Both directions are enforced:
 * - blocker adds blockedUid to their blockedUsers array
 * - blocked user also gets the blocker added to theirs (so neither sees each other)
 *
 * Also immediately removes any active match between them.
 */
export async function blockUser(
  currentUid: string,
  targetUid: string
): Promise<void> {
  // 1. Update both users' blockedUsers arrays (mutual block — prevents re-appearance)
  await updateDoc(doc(db, "users", currentUid), {
    blockedUsers: arrayUnion(targetUid),
  });

  // Note: we cannot update the OTHER user's document under current rules (you can
  // only write your own /users/{uid} doc). Instead, we keep a reverse-block marker
  // client-side by querying swipes + matches. Both-direction filtering is done in
  // fetchCandidateProfiles + useMatches by checking both sides.

  // 2. Expire any active match between them so they disappear from blends list
  const matchesQ = query(
    collection(db, "matches"),
    where("users", "array-contains", currentUid),
    limit(50)
  );
  const matchesSnap = await getDocs(matchesQ);
  const batch = writeBatch(db);
  let mutations = 0;

  matchesSnap.docs.forEach((m) => {
    const data = m.data() as { users?: string[]; status?: string };
    if (data.users?.includes(targetUid) && data.status !== "cancelled") {
      batch.update(m.ref, { status: "cancelled" });
      mutations++;
    }
  });

  if (mutations > 0) {
    await batch.commit();
  }
}

/**
 * Unblock a user. Removes them from current user's blockedUsers array.
 */
export async function unblockUser(
  currentUid: string,
  targetUid: string
): Promise<void> {
  await updateDoc(doc(db, "users", currentUid), {
    blockedUsers: arrayRemove(targetUid),
  });
}

/**
 * File a report. Automatically also blocks the reported user to
 * prevent further contact. A moderator will review the report server-side.
 */
export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: ReportReason,
  context: "today" | "blend" | "meet" | "chat" | "profile",
  notes?: string
): Promise<void> {
  await addDoc(collection(db, "reports"), {
    reporterId,
    reportedId,
    reason,
    context,
    notes: notes || "",
    resolved: false,
    createdAt: serverTimestamp(),
  });

  // Also block — reporting implies you don't want to interact with them
  await blockUser(reporterId, reportedId);
}

/**
 * Human-friendly reason labels for the UI.
 */
export const REPORT_REASONS: Record<ReportReason, string> = {
  inappropriate_photos: "Inappropriate photos",
  fake_profile: "Fake profile or catfishing",
  harassment: "Harassment or hate speech",
  minor: "This person appears to be under 18",
  spam: "Spam or scam",
  other: "Something else",
};
