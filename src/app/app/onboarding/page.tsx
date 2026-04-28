import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import OnboardingForm from './onboarding-form'

export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Verify the user still exists in DB (handles stale JWT after DB reset)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true }
  })

  if (!dbUser) {
    // JWT is completely stale — user no longer exists in DB
    await signOut({ redirect: false })
    redirect('/login')
  }

  // If user already has a valid tenant, redirect to dashboard
  if (dbUser.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: dbUser.tenantId }
    })
    if (tenant) {
      redirect('/dashboard')
    }
  }

  return <OnboardingForm />
}
