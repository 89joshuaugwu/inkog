"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  arrayRemove,
} from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { sendEmail } from "@/lib/sendEmail";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
  bio: string;
  prompt: string;
  onboardingComplete: boolean;
  role: string;
  createdAt: unknown;
  updatedAt: unknown;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  completeOnboarding: (data: {
    username: string;
    displayName: string;
    bio: string;
    prompt: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => {},
  checkUsernameAvailable: async () => false,
  completeOnboarding: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchProfile = useCallback(async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const profile = userSnap.data() as UserProfile;
      setUserProfile(profile);
      return profile;
    } else {
      // Create initial stub profile — onboarding will complete it
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        username: "",
        bio: "",
        prompt: "Send me anonymous messages! 👻",
        onboardingComplete: false,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);
      return newProfile;
    }
  }, []);

  // Refresh profile from Firestore
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user);
  }, [user, fetchProfile]);

  // Update profile fields and refresh local state immediately
  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      // Update local state immediately
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    },
    [user]
  );

  // Check if a username is available
  const checkUsernameAvailable = useCallback(
    async (username: string): Promise<boolean> => {
      if (!username || username.length < 3) return false;
      const usernamesRef = collection(db, "usernames");
      const q = query(usernamesRef, where("username", "==", username.toLowerCase()));
      const snapshot = await getDocs(q);
      return snapshot.empty;
    },
    []
  );

  // Complete onboarding: reserve username + update profile
  const completeOnboarding = useCallback(
    async (data: {
      username: string;
      displayName: string;
      bio: string;
      prompt: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const usernameLower = data.username.toLowerCase();

      // Double-check availability
      const available = await checkUsernameAvailable(usernameLower);
      if (!available) throw new Error("Username already taken");

      // Reserve username in usernames collection
      await setDoc(doc(db, "usernames", usernameLower), {
        uid: user.uid,
        username: usernameLower,
        createdAt: serverTimestamp(),
      });

      // Update user profile
      const userRef = doc(db, "users", user.uid);
      const profileUpdate = {
        username: usernameLower,
        displayName: data.displayName.trim(),
        bio: data.bio.trim(),
        prompt: data.prompt.trim(),
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(userRef, profileUpdate);

      // Update local state
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              ...profileUpdate,
              updatedAt: new Date(),
            }
          : null
      );

      // Send welcome email (fire-and-forget)
      sendEmail("welcome", user.email || "", {
        displayName: data.displayName,
        username: usernameLower,
        email: user.email || "",
      });
    },
    [user, checkUsernameAvailable]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await fetchProfile(result.user);

      // Send login alert for existing users (fire-and-forget)
      if (profile && profile.onboardingComplete && result.user.email) {
        sendEmail("login_alert", result.user.email, {
          displayName: profile.displayName || result.user.displayName || "",
        });
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  }

  async function signOut() {
    try {
      // Remove this device's FCM token before signing out
      if (user) {
        try {
          const deviceToken = sessionStorage.getItem("inkognito_fcm_token");
          if (deviceToken) {
            await updateDoc(doc(db, "users", user.uid), {
              fcmTokens: arrayRemove(deviceToken),
            });
            sessionStorage.removeItem("inkognito_fcm_token");
          }
        } catch {
          // Token cleanup is best-effort — don't block sign out
        }
      }

      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateProfile,
        checkUsernameAvailable,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
