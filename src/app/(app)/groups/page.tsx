'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Users, Plus, LogIn, Copy, Crown, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProGate } from '@/components/subscription/pro-gate';
import {
  useMyGroups, useCreateGroup, useJoinGroup, useLeaveGroup, useDeleteGroup,
} from '@/hooks/use-groups';
import { toast } from 'sonner';

export default function GroupsPage() {
  return (
    <ProGate feature="groups">
      <GroupsContent />
    </ProGate>
  );
}

function memberLabel(count: number, t: ReturnType<typeof useTranslations<'groups'>>) {
  if (count === 1) return `1 ${t('memberCount_one')}`;
  if (count < 5) return `${count} ${t('memberCount_few')}`;
  return `${count} ${t('memberCount_many')}`;
}

function GroupsContent() {
  const t = useTranslations('groups');
  const router = useRouter();
  const { data: groups = [], isLoading } = useMyGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  async function handleCreate() {
    if (!newName.trim()) return;
    await createGroup.mutateAsync(newName.trim());
    setNewName('');
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    await joinGroup.mutateAsync(joinCode.trim());
    setJoinCode('');
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" /> {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" /> {t('createTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder={t('createPlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={40}
            />
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createGroup.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-white shrink-0"
            >
              {t('createBtn')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <LogIn className="w-4 h-4 text-blue-400" /> {t('joinTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder={t('joinPlaceholder')}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={9}
              className="font-mono tracking-widest"
            />
            <Button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joinGroup.isPending}
              variant="outline"
              className="shrink-0"
            >
              {t('joinBtn')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My groups */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t('myGroups')} ({groups.length})
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              {t('noGroups')}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="hover:border-border/80 transition-colors cursor-pointer"
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{group.name}</span>
                      {group.role === 'owner' && (
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {memberLabel(group.member_count, t)}
                      </span>
                      <button
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(group.invite_code);
                          toast.success(t('codeCopied'));
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        {group.invite_code}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {group.role === 'owner' ? (
                      <button
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('deleteConfirm', { name: group.name }))) {
                            deleteGroup.mutate(group.id);
                          }
                        }}
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="text-xs text-muted-foreground hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-400/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('leaveConfirm', { name: group.name }))) {
                            leaveGroup.mutate(group.id);
                          }
                        }}
                      >
                        {t('leave')}
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
