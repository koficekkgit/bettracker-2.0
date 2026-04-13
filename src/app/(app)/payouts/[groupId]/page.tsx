'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, UserPlus, FileText, Wallet, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  usePayoutGroup,
  usePayoutMembers,
  usePayoutPeriods,
  useReferrerBalances,
  useWithdrawReferrer,
  useTogglePaid,
  usePayoutEntries,
  useUpdateMemberReferrer,
  useDeleteGroup,
  type PayoutMember,
} from '@/hooks/use-payouts';
import { useProfile } from '@/hooks/use-profile';
import { AddMemberDialog } from '@/components/payouts/add-member-dialog';
import { NewPeriodDialog } from '@/components/payouts/new-period-dialog';

export default function PayoutGroupDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const { data: profile } = useProfile();
  const { data: group } = usePayoutGroup(groupId);
  const { data: members } = usePayoutMembers(groupId);
  const { data: periods } = usePayoutPeriods(groupId);
  const { data: balances } = useReferrerBalances(groupId);
  const withdraw = useWithdrawReferrer();
  const updateReferrer = useUpdateMemberReferrer();
  const deleteGroup = useDeleteGroup();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newPeriodOpen, setNewPeriodOpen] = useState(false);
  const [openPeriodId, setOpenPeriodId] = useState<string | null>(null);

  const isOwner = profile?.id === group?.owner_id;

  if (!group) return <div className="text-muted-foreground">{t('common.loading')}</div>;

  const balanceMap = new Map((balances ?? []).map((b) => [b.referrer_member_id, b.balance]));

  function memberLabel(memberId: string) {
    const m = members?.find((x) => x.id === memberId);
    return m?.display_name ?? m?.user_id?.slice(0, 8) ?? '?';
  }

  async function handleWithdraw(refMemberId: string) {
    try {
      const amount = await withdraw.mutateAsync({
        group_id: groupId,
        referrer_member_id: refMemberId,
      });
      toast.success(`${t('payouts.withdrawnAmount')}: ${amount}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? JSON.stringify(e);
      console.error('Withdraw error:', e);
      toast.error(msg.includes('nothing_to_withdraw') ? t('payouts.nothingToWithdraw') : msg);
    }
  }

  async function handleChangeReferrer(memberId: string, newReferrerId: string) {
    try {
      await updateReferrer.mutateAsync({
        member_id: memberId,
        group_id: groupId,
        referrer_member_id: newReferrerId || null,
      });
      toast.success(t('payouts.referrerUpdated'));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? JSON.stringify(e);
      console.error('Update referrer error:', e);
      toast.error(msg);
    }
  }

  async function handleDeleteGroup() {
    if (!group) return;
    const confirmed = confirm(
      t('payouts.deleteGroupConfirm').replace('{name}', group.name)
    );
    if (!confirmed) return;
    try {
      await deleteGroup.mutateAsync(groupId);
      toast.success(t('payouts.groupDeleted'));
      router.push('/payouts');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? JSON.stringify(e);
      console.error('Delete group error:', e);
      toast.error(msg);
    }
  }

  // Pro select: nemůžeš sám sobě být referem, ani vytvořit cyklus
  function availableReferrersFor(member: PayoutMember): PayoutMember[] {
    return (members ?? []).filter((m) => {
      if (m.id === member.id) return false;
      // Zabraň přímému cyklu: pokud kandidát už má jako svého refera mě, nelze ho zvolit
      if (m.referrer_member_id === member.id) return false;
      return true;
    });
  }

  return (
    <div className="space-y-6">
      <Link href="/payouts" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" />
        {t('payouts.backToGroups')}
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold">{group.name}</h1>
        {isOwner && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setAddMemberOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              {t('payouts.addMember')}
            </Button>
            <Button onClick={() => setNewPeriodOpen(true)} disabled={!members?.length}>
              <FileText className="w-4 h-4 mr-2" />
              {t('payouts.newPeriod')}
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteGroup}
              disabled={deleteGroup.isPending}
              className="text-destructive hover:text-destructive border-destructive/40 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('payouts.deleteGroup')}
            </Button>
          </div>
        )}
      </div>

      {/* Členové (jen owner) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>{t('payouts.members')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!members?.length && (
              <div className="text-sm text-muted-foreground">{t('payouts.noMembers')}</div>
            )}
            <div className="space-y-3">
              {members?.map((m) => {
                const balance = balanceMap.get(m.id) ?? 0;
                const isReferrer = members.some((x) => x.referrer_member_id === m.id);
                const availableReferrers = availableReferrersFor(m);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 flex-wrap"
                  >
                    <div className="flex-1 min-w-[180px]">
                      <div className="font-medium">
                        {m.display_name ?? m.user_id?.slice(0, 8)}
                        {!m.user_id && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({t('payouts.unlinked')})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inline editor refera */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t('payouts.referrer')}:</span>
                      <select
                        value={m.referrer_member_id ?? ''}
                        onChange={(e) => handleChangeReferrer(m.id, e.target.value)}
                        disabled={updateReferrer.isPending}
                        className="bg-background border border-border rounded-md px-2 py-1 text-sm"
                      >
                        <option value="">— {t('common.none')} —</option>
                        {availableReferrers.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.display_name ?? r.user_id?.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Refer balance + withdraw */}
                    {isReferrer && (
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <span className={balance >= 0 ? 'text-emerald-500' : 'text-destructive'}>
                          {balance.toFixed(2)}
                        </span>
                        {balance > 0 && (
                          <Button size="sm" variant="outline" onClick={() => handleWithdraw(m.id)}>
                            {t('payouts.withdraw')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historie období */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payouts.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!periods?.length && (
            <div className="text-sm text-muted-foreground">{t('payouts.noPeriods')}</div>
          )}
          <div className="space-y-2">
            {periods?.map((p) => (
              <div key={p.id}>
                <button
                  onClick={() => setOpenPeriodId(openPeriodId === p.id ? null : p.id)}
                  className="w-full flex justify-between items-center py-2 px-3 rounded hover:bg-muted text-left"
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.closed_at).toLocaleDateString()}
                  </span>
                </button>
                {openPeriodId === p.id && (
                  <PeriodEntries
                    periodId={p.id}
                    memberLabel={memberLabel}
                    isOwner={isOwner}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <>
          <AddMemberDialog
            open={addMemberOpen}
            onOpenChange={setAddMemberOpen}
            groupId={groupId}
            members={members ?? []}
          />
          <NewPeriodDialog
            open={newPeriodOpen}
            onOpenChange={setNewPeriodOpen}
            group={group}
            members={members ?? []}
          />
        </>
      )}
    </div>
  );
}

function PeriodEntries({
  periodId,
  memberLabel,
  isOwner,
}: {
  periodId: string;
  memberLabel: (id: string) => string;
  isOwner: boolean;
}) {
  const t = useTranslations();
  const { data: entries } = usePayoutEntries(periodId);
  const togglePaid = useTogglePaid();

  if (!entries) return null;
  return (
    <div className="px-3 py-2 bg-muted/30 rounded-b text-sm space-y-1">
      {entries.map((e) => (
        <div key={e.id} className="flex justify-between items-center py-1">
          <div className="flex-1">
            <span className="font-medium">{memberLabel(e.member_id)}</span>
            <span className="text-muted-foreground ml-2">P/L: {e.member_pnl.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>{t('payouts.member')}: {e.member_share.toFixed(2)}</span>
            <span>{t('payouts.owner')}: {e.owner_share.toFixed(2)}</span>
            {e.referrer_share !== 0 && (
              <span>{t('payouts.refer')}: {e.referrer_share.toFixed(2)}</span>
            )}
            {isOwner && (
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={e.is_paid}
                  onChange={(ev) =>
                    togglePaid.mutate({ entry_id: e.id, is_paid: ev.target.checked })
                  }
                />
                {t('payouts.paid')}
              </label>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
