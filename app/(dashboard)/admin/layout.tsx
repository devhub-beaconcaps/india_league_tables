import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims } = await auth()

  // Redirect non-admins away from /admin/*
  if (sessionClaims?.metadata?.role !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}