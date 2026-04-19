'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, LogIn, Copy, Crown, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProGate } from '@/components/subscription/pro-gate';
import {
  useMyGroups, useCreateGroup, useJoinGroup, useLeaveGroup, useDeleteGroup,
} from '@/hooks/use-groups';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function GroupsPage() {
  return (
    <ProGate feature="groups">
      <GroupsContent />
    </ProGate>
  );
}

function GroupsContent() {
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
          <Users className="w-6 h-6" /> Skupiny
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vytvoř skupinu nebo se připoj ke stávající. Uvnitř skupiny vidíš statistiky všech členů.
        </p>
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" /> Vytvořit skupinu
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Název skupiny..."
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
              Vytvořit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <LogIn className="w-4 h-4 text-blue-400" /> Připojit se kódem
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="XXXX-XXXX"
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
              Připojit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My groups */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Moje skupiny ({groups.length})
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Načítám...</p>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Zatím nejsi v žádné skupině. Vytvoř novou nebo se připoj kódem.
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
                        {group.member_count} {group.member_count === 1 ? 'člen' : group.member_count < 5 ? 'členové' : 'členů'}
                      </span>
                      <button
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(group.invite_code);
                          toast.success('Kód zkopírován');
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
                          if (confirm(`Smazat skupinu "${group.name}"? Tato akce je nevratná.`)) {
                            deleteGroup.mutate(group.id);
                          }
                        }}
                        title="Smazat skupinu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="text-xs text-muted-foreground hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-400/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Opustit skupinu "${group.name}"?`)) {
                            leaveGroup.mutate(group.id);
                          }
                        }}
                      >
                        Opustit
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
