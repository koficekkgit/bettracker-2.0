import { Sidebar } from '@/components/layout/sidebar';
import { TrialBanner } from '@/components/subscription/trial-banner';
import { UsernameOnboardingDialog } from '@/components/auth/username-onboarding-dialog';
import { AuthCacheReset } from '@/components/auth/auth-cache-reset';
import { AchievementsSync } from '@/components/auth/achievements-sync';
import { GlobalPaywall } from '@/components/subscription/global-paywall';
import { SubscriptionOnboardingDialog } from '@/components/subscription/subscription-onboarding-dialog';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col md:flex-row bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <TrialBanner />
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <GlobalPaywall>{children}</GlobalPaywall>
        </main>
      </div>
      <UsernameOnboardingDialog />
      <SubscriptionOnboardingDialog />
      <AuthCacheReset />
      <AchievementsSync />
    </div>
  );
}
