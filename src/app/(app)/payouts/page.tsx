'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Plus, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayoutGroups } from '@/hooks/use-payouts';
import { useProfile } from '@/hooks/use-profile';
import { CreateGroupDialog } from '@/components/payouts/create-group-dialog';

export default function PayoutsPage() {
  const t = useTranslations();
  const { data: profile } = useProfile();
  const { data: groups, isLoading } = usePayoutGroups();
  const [createOpen, setCreateOpen] = useState(false);

  if (profile && !profile.payouts_enabled) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('payouts.notEnabled')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('payouts.title')}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('payouts.newGroup')}
        </Button>
      </div>

      {isLoading && <div className="text-muted-foreground">{t('common.loading')}</div>}

      {!isLoading && groups && groups.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('payouts.noGroups')}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {groups?.map((g) => (
          <Link key={g.id} href={`/payouts/${g.id}`}>
            <Card className="hover:border-primary/50 transition cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {g.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>
                  {t('payouts.profitSplit')}: {g.profit_split_member}% / {g.profit_split_owner}%
                </div>
                <div>
                  {t('payouts.lossSplit')}: {g.loss_split_member}% / {g.loss_split_owner}%
                </div>
                {g.referrer_share_pct > 0 && (
                  <div>
                    {t('payouts.referrerShare')}: {g.referrer_share_pct}%
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
