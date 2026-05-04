'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, CheckCircle2, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSubmitFeedback, type FeedbackType } from '@/hooks/use-feedback';

const TYPES: { value: FeedbackType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'bug',        label: 'Bug',   icon: Bug,         color: 'text-red-400    border-red-500/40    bg-red-500/10    data-[active=true]:border-red-500    data-[active=true]:bg-red-500/20'    },
  { value: 'suggestion', label: 'Návrh', icon: Lightbulb,   color: 'text-amber-400  border-amber-500/40  bg-amber-500/10  data-[active=true]:border-amber-500  data-[active=true]:bg-amber-500/20'  },
  { value: 'other',      label: 'Jiné',  icon: HelpCircle,  color: 'text-slate-400  border-slate-500/40  bg-slate-500/10  data-[active=true]:border-slate-500  data-[active=true]:bg-slate-500/20'  },
];

export function FeedbackWidget() {
  const [open,    setOpen]    = useState(false);
  const [type,    setType]    = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [done,    setDone]    = useState(false);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);
  const submit                = useSubmitFeedback();

  // Auto-focus textarea when panel opens
  useEffect(() => {
    if (open && !done) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [open, done]);

  // Close panel on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleToggle() {
    setOpen(o => !o);
    if (done) {
      // reset on re-open after success
      setDone(false);
      setMessage('');
      setType('bug');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) return;
    await submit.mutateAsync({ type, message });
    setDone(true);
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating panel */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl',
          'transition-all duration-200 origin-bottom-right',
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="text-sm font-semibold">Zpětná vazba</p>
            <p className="text-xs text-muted-foreground">Napiš nám bug nebo návrh</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {done ? (
            /* Success state */
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
              <p className="font-medium">Díky za zpětnou vazbu!</p>
              <p className="text-xs text-muted-foreground">Přečteme si to a ozveme se, pokud bude potřeba.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setDone(false); setMessage(''); setType('bug'); }}
              >
                Odeslat další
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Type selector */}
              <div className="flex gap-2">
                {TYPES.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    data-active={type === value}
                    onClick={() => setType(value)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-all',
                      color,
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'        ? 'Popiš, co se stalo…'      :
                  type === 'suggestion' ? 'Co bys chtěl přidat?'     :
                                         'Napiš cokoliv…'
                }
                rows={4}
                className={cn(
                  'w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring',
                  'transition-colors',
                )}
              />

              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-xs',
                  message.trim().length < 5 ? 'text-muted-foreground' : 'text-success',
                )}>
                  {message.trim().length} znaků
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={message.trim().length < 5 || submit.isPending}
                >
                  <Send className="w-3.5 h-3.5" />
                  {submit.isPending ? 'Odesílám…' : 'Odeslat'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* FAB button */}
      <button
        onClick={handleToggle}
        className={cn(
          'fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center',
          'rounded-full shadow-lg transition-all duration-200',
          'bg-primary text-primary-foreground hover:scale-105 active:scale-95',
          open && 'rotate-180',
        )}
        title="Zpětná vazba"
        aria-label="Otevřít zpětnou vazbu"
      >
        {open
          ? <X className="w-5 h-5" />
          : <MessageCircle className="w-5 h-5" />
        }
      </button>
    </>
  );
}
