"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { type User as FirebaseUser } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";
import { getUser } from "@/lib/db";
import type { User } from "@/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: User | null;
  loading: boolean;
  hasProfile: boolean;
  /** Set when the profile read failed. The app is usable; the profile is not. */
  profileError: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  profile: null,
  loading: true,
  hasProfile: false,
  profileError: false,
  refreshProfile: async () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  async function fetchProfile(uid: string) {
    try {
      const p = await getUser(uid);
      setProfile(p);
      setProfileError(false);
    } catch (err) {
      // Offline, a permission-denied from freshly deployed rules, anything:
      // swallow it here so the caller always reaches setLoading(false).
      console.error("Profile fetch failed:", err);
      setProfile(null);
      setProfileError(true);
    }
  }

  async function refreshProfile() {
    if (firebaseUser) {
      await fetchProfile(firebaseUser.uid);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      try {
        if (user) {
          await fetchProfile(user.uid);
        } else {
          setProfile(null);
          setProfileError(false);
        }
      } finally {
        // Must always run. Previously an exception from fetchProfile escaped
        // this callback and left loading:true forever, which renders the app
        // as a permanent loading pulse with no way out but a reload.
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        hasProfile: !!profile,
        profileError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
