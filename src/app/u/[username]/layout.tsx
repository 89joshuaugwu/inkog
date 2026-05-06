import type { Metadata } from "next";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  let displayName = username;
  let bio = "Send anonymous messages — no judgment, no filters.";

  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      displayName = data.displayName || username;
      bio = data.bio || bio;
    }
  } catch {
    // Fallback to defaults
  }

  const title = `Send @${username} an anonymous message`;
  const description = `${displayName} is on Inkognito — ${bio}. Send them an anonymous message now! 👻`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
