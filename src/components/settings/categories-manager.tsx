'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-bets';
import type { Category } from '@/lib/types';

const PRESET_COLORS = [
  '#22c55e', // green - fotbal
  '#3b82f6', // blue - hokej
  '#eab308', // yellow - tenis
  '#f97316', // orange - basketbal
  '#ec4899', // pink
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ef4444', // red
  '#84cc16', // lime
  '#737373', // gray
];

export function CategoriesManager() {
  const t = useTranslations();
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (newName.trim().length === 0) return;
    await createCategory.mutateAsync({ name: newName, color: newColor });
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color ?? PRESET_COLORS[0]);
  }

  async function saveEdit() {
    if (!editingId || editName.trim().length === 0) return;
    await updateCategory.mutateAsync({ id: editingId, name: editName, color: editColor });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  }

  async function handleDelete(cat: Category) {
    if (confirm(t('settings.deleteCategoryConfirm'))) {
      await deleteCategory.mutateAsync(cat.id);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{t('settings.categories')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seznam existujících kategorií */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('settings.noCategoriesYet')}</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border"
              >
                {editingId === cat.id ? (
                  <>
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                    />
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      className="flex-1"
                    />
                    <Button size="icon" variant="ghost" onClick={saveEdit}>
                      <Check className="w-4 h-4 text-success" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(cat)}
                      className="w-4 h-4 rounded-full flex-shrink-0 border border-border"
                      style={{ backgroundColor: cat.color ?? '#3b82f6' }}
                      aria-label="Edit color"
                    />
                    <button
                      onClick={() => startEdit(cat)}
                      className="flex-1 text-left text-sm hover:underline"
                    >
                      {cat.name}
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(cat)}
                      disabled={deleteCategory.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulář pro přidání nové */}
        <form onSubmit={handleCreate} className="space-y-3 pt-2 border-t border-border">
          <div className="space-y-2">
            <Label>{t('settings.categoryName')}</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent flex-shrink-0"
                aria-label={t('settings.categoryColor')}
              />
              <Input
                placeholder={t('settings.categoryNamePlaceholder')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={createCategory.isPending || newName.trim().length === 0}>
                <Plus className="w-4 h-4" />
                {t('settings.addCategory')}
              </Button>
            </div>
          </div>

          {/* Rychlá volba barvy */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  newColor === color ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
