'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, UserPlus, Check, X, Eye, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useFriends,
  useSearchProfile,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRemoveFriend,
} from '@/hooks/use-friends';

export default function FriendsPage() {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedTerm, setSubmittedTerm] = useState('');

  const { data: friends = [], isLoading } = useFriends();
  const { data: searchResult, isFetching: searching } = useSearchProfile(submittedTerm);
  const sendRequest = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriend();

  const accepted = friends.filter((f) => f.status === 'accepted');
  const incoming = friends.filter((f) => f.direction === 'incoming');
  const outgoing = friends.filter((f) => f.direction === 'outgoing');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmittedTerm(searchTerm.trim());
  }

  async function handleSendRequest(addresseeId: string) {
    await sendRequest.mutateAsync(addresseeId);
    setSubmittedTerm('');
    setSearchTerm('');
  }

  async function handleRemove(friendshipId: string) {
    if (confirm(t('friends.removeConfirm'))) {
      await remove.mutateAsync(friendshipId);
    }
  }

  // Skrýt search result, pokud je už ve friendships
  const alreadyConnected =
    searchResult && friends.some((f) => f.friend_id === searchResult.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('friends.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('friends.subtitle')}</p>
      </div>

      {/* Vyhledávání */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('friends.search')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('friends.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={searchTerm.length < 2}>
              {t('common.search')}
            </Button>
          </form>

          {submittedTerm && !searching && (
            <div className="mt-4">
              {!searchResult ? (
                <p className="text-sm text-muted-foreground">{t('friends.noResults')}</p>
              ) : alreadyConnected ? (
                <div className="flex items-center justify-between p-3 rounded-md border border-border">
                  <div>
                    <p className="font-medium">{searchResult.display_name ?? searchResult.username}</p>
                    <p className="text-xs text-muted-foreground">@{searchResult.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">✓</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-md border border-border">
                  <div>
                    <p className="font-medium">{searchResult.display_name ?? searchResult.username}</p>
                    <p className="text-xs text-muted-foreground">@{searchResult.username}</p>
                  </div>
                  <Button size="sm" onClick={() => handleSendRequest(searchResult.id)}>
                    <UserPlus className="w-4 h-4" />
                    {t('friends.sendRequest')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Příchozí žádosti */}
      {incoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {t('friends.incoming')} ({incoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incoming.map((f) => (
              <div
                key={f.friendship_id}
                className="flex items-center justify-between p-3 rounded-md border border-border"
              >
                <div>
                  <p className="font-medium">{f.display_name ?? f.username}</p>
                  <p className="text-xs text-muted-foreground">@{f.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => accept.mutateAsync(f.friendship_id)}
                  >
                    <Check className="w-4 h-4" />
                    {t('friends.accept')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => remove.mutateAsync(f.friendship_id)}
                  >
                    <X className="w-4 h-4" />
                    {t('friends.decline')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Moji přátelé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {t('friends.myFriends')} ({accepted.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : accepted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t('friends.noFriends')}</p>
          ) : (
            accepted.map((f) => (
              <div
                key={f.friendship_id}
                className="flex items-center justify-between p-3 rounded-md border border-border"
              >
                <div>
                  <p className="font-medium">{f.display_name ?? f.username}</p>
                  <p className="text-xs text-muted-foreground">@{f.username}</p>
                </div>
                <div className="flex gap-2">
                  {f.username && (
                    <Link href={`/friends/${f.username}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                        {t('friends.viewDashboard')}
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(f.friendship_id)}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Odeslané žádosti */}
      {outgoing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {t('friends.outgoing')} ({outgoing.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outgoing.map((f) => (
              <div
                key={f.friendship_id}
                className="flex items-center justify-between p-3 rounded-md border border-border"
              >
                <div>
                  <p className="font-medium">{f.display_name ?? f.username}</p>
                  <p className="text-xs text-muted-foreground">@{f.username}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutateAsync(f.friendship_id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
