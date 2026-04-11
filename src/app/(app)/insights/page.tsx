'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface InsightResult {
  analysis: string;
  generated_at: string;
}

/**
 * Velmi lehký markdown parser - pro headers, bold a seznamy.
 * Nevolím plnou knihovnu (marked, react-markdown), abych zbytečně nezvětšoval bundle.
 */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let key = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-3 text-sm">
          {currentList.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const renderInline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-secondary text-xs">$1</code>');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-lg font-semibold mt-5 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={key++} className="text-xl font-semibold mt-6 mb-3">
          {line.slice(2)}
        </h1>
      );
    } else if (/^[-*]\s/.test(line)) {
      currentList.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-sm my-2 pl-4"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />
      );
    } else {
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-sm my-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />
      );
    }
  }
  flushList();
  return elements;
}

export default function InsightsPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InsightResult | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/insights', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'not_enough_data') {
          toast.error(t('insights.notEnoughData'));
        } else if (data.error === 'not_configured') {
          toast.error(t('insights.notConfigured'));
        } else {
          toast.error(t('insights.error'));
        }
        return;
      }

      setResult({ analysis: data.analysis, generated_at: data.generated_at });
    } catch (err) {
      toast.error(t('insights.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          {t('insights.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('insights.subtitle')}</p>
      </div>

      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">{t('insights.whatWillAnalyze')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                <span>{t('insights.item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                <span>{t('insights.item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                <span>{t('insights.item3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                <span>{t('insights.item4')}</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground pt-2">
              {t('insights.period')}: 90 dní
            </p>
            <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
              <Sparkles className="w-4 h-4" />
              {loading ? t('insights.generating') : t('insights.generate')}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {renderMarkdown(result.analysis)}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">
              {t('insights.lastGenerated')}:{' '}
              {new Date(result.generated_at).toLocaleString('cs-CZ')}
            </p>
            <Button variant="outline" onClick={generate} disabled={loading}>
              <Sparkles className="w-4 h-4" />
              {loading ? t('insights.generating') : t('insights.generate')}
            </Button>
          </div>
        </>
      )}

      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground">{t('insights.disclaimer')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
