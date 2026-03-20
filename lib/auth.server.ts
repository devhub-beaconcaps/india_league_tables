import "server-only"; // ensures this file is never accidentally imported by a client component
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Use in Server Components / Server Actions only.
 * Returns the current userId or redirects to /sign-in.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}