import React from 'react';
import { useChurch } from '@/contexts/ChurchContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ChurchSwitcher: React.FC = () => {
  const { currentChurch, userChurches, setCurrentChurch, loading } = useChurch();

  if (loading || userChurches.length === 0) {
    return null;
  }

  // Single church — no switcher needed, just display
  if (userChurches.length === 1) {
    const church = userChurches[0]?.churches;
    if (!church) return null;

    return (
      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
        <p className="font-bold text-indigo-900 text-sm">{church.name}</p>
        <p className="text-xs text-indigo-600">Plano {church.plan ?? 'Free'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Select
        value={currentChurch?.id ?? ''}
        onValueChange={(value) => setCurrentChurch(value)}
      >
        <SelectTrigger className="w-full bg-indigo-50 border-indigo-100 text-indigo-900 font-semibold text-sm h-10">
          <SelectValue placeholder="Selecionar igreja" />
        </SelectTrigger>
        <SelectContent>
          {userChurches.map((member) => {
            const church = member.churches;
            if (!church) return null;
            return (
              <SelectItem key={church.id} value={church.id}>
                <span className="flex items-center gap-2">
                  <span>{church.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {church.plan ?? 'Free'}
                  </span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {currentChurch && (
        <p className="text-xs text-indigo-600 px-1">
          Plano {currentChurch.plan ?? 'Free'}
        </p>
      )}
    </div>
  );
};
