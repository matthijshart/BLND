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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  profile: null,
  loading: true,
  hasProfile: false,
  refreshProfile: async () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(uid: string) {
    const p = await getUser(uid);
    setProfile(p);
  }

  async function refreshProfile() {
    if (firebaseUser) {
      await fetchProfile(firebaseUser.uid);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
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
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
