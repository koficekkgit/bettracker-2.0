'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscriptionPanel } from '@/components/subscription/subscription-panel';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SubscriptionDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <SubscriptionPanel />
      </div>
    </div>
  );
}
