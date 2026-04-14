import { Sidebar } from '@/components/layout/sidebar';
import { TrialBanner } from '@/components/subscription/trial-banner';
import { UsernameOnboardingDialog } from '@/components/auth/username-onboarding-dialog';
import { AuthCacheReset } from '@/components/auth/auth-cache-reset';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TrialBanner />
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">{children}</main>
      </div>
      <UsernameOnboardingDialog />
      <AuthCacheReset />
    </div>
  );
}
