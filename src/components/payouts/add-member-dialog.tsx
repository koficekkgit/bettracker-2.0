'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddMember, useLookupUser, type PayoutMember } from '@/hooks/use-payouts';

export function AddMemberDialog({
  open,
  onOpenChange,
  groupId,
  members,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string;
  members: PayoutMember[];
}) {
  const t = useTranslations();
  const add = useAddMember();
  const lookup = useLookupUser();
  const [displayName, setDisplayName] = useState('');
  const [usernameToLink, setUsernameToLink] = useState('');
  const [referrerId, setReferrerId] = useState<string>('');
  const [linkedUser, setLinkedUser] = useState<{ id: string; username: string } | null>(null);

  if (!open) return null;

  async function handleLookup() {
    if (!usernameToLink.trim()) return;
    const result = await lookup.mutateAsync(usernameToLink.trim());
    if (result) {
      setLinkedUser({ id: result.id, username: result.username });
      if (!displayName) setDisplayName(result.username);
      toast.success(t('payouts.userFound'));
    } else {
      toast.error(t('payouts.userNotFound'));
      setLinkedUser(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() && !linkedUser) return;
    try {
      await add.mutateAsync({
        group_id: groupId,
        user_id: linkedUser?.id ?? null,
        display_name: displayName.trim() || null,
        referrer_member_id: referrerId || null,
      });
      toast.success(t('payouts.memberAdded'));
      setDisplayName('');
      setUsernameToLink('');
      setReferrerId('');
      setLinkedUser(null);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">{t('payouts.addMember')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('payouts.displayName')}</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Honza Novák"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('payouts.linkUsername')} ({t('common.optional')})</Label>
            <div className="flex gap-2">
              <Input
                value={usernameToLink}
                onChange={(e) => setUsernameToLink(e.target.value)}
                placeholder="username"
              />
              <Button type="button" variant="outline" onClick={handleLookup}>
                {t('payouts.lookup')}
              </Button>
            </div>
            {linkedUser && (
              <p className="text-xs text-emerald-500">✓ {linkedUser.username}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t('payouts.referrer')} ({t('common.optional')})</Label>
            <select
              value={referrerId}
              onChange={(e) => setReferrerId(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
            >
              <option value="">— {t('common.none')} —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name ?? m.user_id?.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={add.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
