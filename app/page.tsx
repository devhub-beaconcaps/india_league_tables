'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return; // wait for Clerk to finish loading

    if (userId) {
      router.replace('/dashboard');
      console.log('user in',userId);
      
    } else {
      router.replace('/sign-in');
      console.log('user out',userId);
    }
  }, [isLoaded, userId, router]);

  return null; // or a loading spinner
}
