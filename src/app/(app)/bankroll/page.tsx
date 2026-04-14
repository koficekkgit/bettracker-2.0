'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Wallet, AlertTriangle, Archive, Settings2, ArrowUpCircle, ArrowDownCircle, Edit3, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProGate } from '@/components/subscription/pro-gate';
import {
  useBookmakerAccounts,
  useAccountBalances,
  useArchiveAccount,
  usePendingWithdrawals,
  useConfirmTransaction,
} from '@/hooks/use-bankroll';
import { useProfile } from '@/hooks/use-profile';
import { CreateAccountDialog } from '@/components/bankroll/create-account-dialog';
import { TransactionDialog } from '@/components/bankroll/transaction-dialog';
import { AccountSettingsDialog } from '@/components/bankroll/account-settings-dialog';
import { AccountDetailDialog } from '@/components/bankroll/account-detail-dialog';
import { BalanceChart } from '@/components/bankroll/balance-chart';
import { SetBalanceDialog } from '@/components/bankroll/set-balance-dialog';
import { BankrollOnboardingDialog } from '@/components/bankroll/onboarding-dialog';
import type { BookmakerAccount } from '@/lib/bankroll';
import { toast } from 'sonner';

export default function BankrollPage() {
  return (
    <ProGate feature="bankroll">
      <BankrollContent />
    </ProGate>
  );
}

function BankrollContent() {
  const t = useTranslations();
  const { data: profile } = useProfile();
  const { data: accounts, isLoading } = useBookmakerAccounts();
  const { data: balances } = useAccountBalances();
  const { data: pendingWds } = usePendingWithdrawals();
  const archive = useArchiveAccount();
  const confirmTx = useConfirmTransaction();

  const [createOpen, setCreateOpen] = useState(false);
  const [txDialog, setTxDialog] = useState<{ account: BookmakerAccount; kind: 'deposit' | 'withdrawal' } | null>(null);
  const [settingsDialog, setSettingsDialog] = useState<BookmakerAccount | null>(null);
  const [detailDialog, setDetailDialog] = useState<BookmakerAccount | null>(null);
  const [setBalanceDialog, setSetBalanceDialog] = useState<BookmakerAccount | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [chartScope, setChartScope] = useState<'all' | string>('all');

  const balanceMap = useMemo(
    () => new Map((balances ?? []).map((b) => [b.account_id, b.balance])),
    [balances]
  );

  const expectedBalanceMap = useMemo(
    () => new Map((balances ?? []).map((b) => [b.account_id, b.balance_expected])),
    [balances]
  );

  const pendingCountMap = useMemo(
    () => new Map((balances ?? []).map((b) => [b.account_id, b.pending_withdrawals])),
    [balances]
  );

  const totalBalance = useMemo(
    () => (balances ?? []).reduce((sum, b) => sum + Number(b.balance), 0),
    [balances]
  );

  const totalExpected = useMemo(
    () => (balances ?? []).reduce((sum, b) => sum + Number(b.balance_expected), 0),
    [balances]
  );

  async function handleConfirmWithdrawal(txId: string) {
    try {
      await confirmTx.mutateAsync({ transaction_id: txId, confirmed: true });
      toast.success(t('bankroll.withdrawalConfirmed'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  }

  // Automaticky otevřít onboarding při prvním načtení, pokud user ještě neprošel a má účty
  useEffect(() => {
    if (!profile || !accounts) return;
    if (profile.bankroll_onboarded_at) return;
    if (accounts.length === 0) return;
    // Jen pokud ještě neběží
    setOnboardingOpen(true);
  }, [profile, accounts]);

  async function handleArchive(acc: BookmakerAccount) {
    if (!confirm(t('bankroll.archiveConfirm').replace('{name}', acc.name))) return;
    try {
      await archive.mutateAsync(acc.id);
      toast.success(t('bankroll.archived'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  }

  if (isLoading) return <div className="text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('bankroll.title')}</h1>
          <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
            <div>
              {t('bankroll.totalBalance')}:{' '}
              <span className={totalBalance >= 0 ? 'text-emerald-500 font-semibold' : 'text-destructive font-semibold'}>
                {totalBalance.toFixed(2)} Kč
              </span>
            </div>
            {totalExpected !== totalBalance && (
              <div className="text-xs">
                {t('bankroll.expectedBalance')}:{' '}
                <span className={totalExpected >= 0 ? 'text-emerald-500/70' : 'text-destructive/70'}>
                  {totalExpected.toFixed(2)} Kč
                </span>
              </div>
            )}
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('bankroll.newAccount')}
        </Button>
      </div>

      {!accounts?.length && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('bankroll.noAccounts')}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {accounts?.map((acc) => {
          const balance = Number(balanceMap.get(acc.id) ?? 0);
          const expected = Number(expectedBalanceMap.get(acc.id) ?? 0);
          const pendingCount = Number(pendingCountMap.get(acc.id) ?? 0);
          const lowBalance =
            acc.low_balance_threshold !== null && balance < Number(acc.low_balance_threshold);
          return (
            <Card
              key={acc.id}
              className={lowBalance ? 'border-destructive/50' : ''}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <button
                    onClick={() => setDetailDialog(acc)}
                    className="flex items-center gap-2 hover:underline text-left"
                  >
                    <Wallet className="w-5 h-5" />
                    {acc.name}
                    {pendingCount > 0 && (
                      <span className="ml-1 inline-flex items-center gap-1 text-xs text-amber-500 font-normal">
                        <Clock className="w-3 h-3" />
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSetBalanceDialog(acc)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title={t('bankroll.setCurrentBalance')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSettingsDialog(acc)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title={t('bankroll.settings')}
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(acc)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      title={t('bankroll.archive')}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">{t('bankroll.balance')}</div>
                  <div className={`text-2xl font-bold ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    {balance.toFixed(2)} {acc.currency}
                  </div>
                  {expected !== balance && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t('bankroll.expectedBalance')}:{' '}
                      <span className={expected >= 0 ? 'text-emerald-500/80' : 'text-destructive/80'}>
                        {expected.toFixed(2)} {acc.currency}
                      </span>
                    </div>
                  )}
                  {lowBalance && (
                    <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('bankroll.lowBalanceAlert')}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setTxDialog({ account: acc, kind: 'deposit' })}
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-1" />
                    {t('bankroll.deposit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setTxDialog({ account: acc, kind: 'withdrawal' })}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-1" />
                    {t('bankroll.withdraw')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seznam čekajících výběrů */}
      {pendingWds && pendingWds.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-amber-500" />
              {t('bankroll.pendingWithdrawals')} ({pendingWds.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendingWds.map((wd) => (
                <div key={wd.id} className="flex items-center gap-3 p-3">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {wd.bookmaker_accounts.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(wd.created_at).toLocaleDateString()}
                      {wd.notes && ` · ${wd.notes}`}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-destructive whitespace-nowrap">
                    {Number(wd.amount).toFixed(2)} {wd.bookmaker_accounts.currency}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfirmWithdrawal(wd.id)}
                    disabled={confirmTx.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {t('bankroll.confirm')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graf */}
      {accounts && accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>{t('bankroll.balanceChart')}</span>
              <select
                value={chartScope}
                onChange={(e) => setChartScope(e.target.value)}
                className="bg-background border border-border rounded-md px-2 py-1 text-sm"
              >
                <option value="all">{t('bankroll.allAccounts')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceChart scope={chartScope} accounts={accounts} />
          </CardContent>
        </Card>
      )}

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
      {txDialog && (
        <TransactionDialog
          open={true}
          onOpenChange={(v) => !v && setTxDialog(null)}
          account={txDialog.account}
          kind={txDialog.kind}
        />
      )}
      {settingsDialog && (
        <AccountSettingsDialog
          open={true}
          onOpenChange={(v) => !v && setSettingsDialog(null)}
          account={settingsDialog}
        />
      )}
      {detailDialog && (
        <AccountDetailDialog
          open={true}
          onOpenChange={(v) => !v && setDetailDialog(null)}
          account={detailDialog}
        />
      )}
      {setBalanceDialog && (
        <SetBalanceDialog
          open={true}
          onOpenChange={(v) => !v && setSetBalanceDialog(null)}
          account={setBalanceDialog}
          currentBalance={Number(balanceMap.get(setBalanceDialog.id) ?? 0)}
        />
      )}
      <BankrollOnboardingDialog
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        accounts={accounts ?? []}
        balances={balances ?? []}
      />
    </div>
  );
}
