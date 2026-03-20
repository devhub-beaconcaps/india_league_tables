'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

// This page handles the redirect back from Google OAuth.
// Clerk processes the callback and redirects to /dashboard automatically.
export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F7FF] dark:bg-[#0f0f1a]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Completing sign in...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}