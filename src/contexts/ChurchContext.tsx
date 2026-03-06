import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserChurches, getMemberRole } from '@/services/memberService';
import type { MemberChurch } from '@/services/memberService';
import type { Church, ChurchRole } from '@/types/database';

const STORAGE_KEY = 'churchify_current_church';

interface ChurchContextType {
  currentChurch: Church | null;
  currentRole: ChurchRole | null;
  userChurches: MemberChurch[];
  setCurrentChurch: (churchId: string) => void;
  loading: boolean;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentChurch, setCurrentChurchState] = useState<Church | null>(null);
  const [currentRole, setCurrentRole] = useState<ChurchRole | null>(null);
  const [userChurches, setUserChurches] = useState<MemberChurch[]>([]);
  const [loading, setLoading] = useState(true);

  const selectChurch = useCallback(
    async (churchId: string, churches: MemberChurch[]) => {
      if (!user) return;

      const member = churches.find((m) => m.churches?.id === churchId);
      if (!member?.churches) return;

      setCurrentChurchState(member.churches as Church);
      localStorage.setItem(STORAGE_KEY, churchId);

      try {
        const role = await getMemberRole(churchId, user.id);
        setCurrentRole(role);
      } catch (error) {
        console.error('Error fetching member role:', error);
        setCurrentRole(null);
      }
    },
    [user],
  );

  // Load user churches when auth user changes
  useEffect(() => {
    if (!user) {
      setUserChurches([]);
      setCurrentChurchState(null);
      setCurrentRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadChurches = async () => {
      setLoading(true);
      try {
        const churches = await getUserChurches(user.id);
        if (cancelled) return;

        setUserChurches(churches);

        if (churches.length === 0) {
          setCurrentChurchState(null);
          setCurrentRole(null);
          setLoading(false);
          return;
        }

        // Auto-select: localStorage first, then first church
        const savedId = localStorage.getItem(STORAGE_KEY);
        const savedChurch = savedId
          ? churches.find((m) => m.churches?.id === savedId)
          : null;

        const targetId = savedChurch?.churches?.id ?? churches[0]?.churches?.id;
        if (targetId) {
          await selectChurch(targetId, churches);
        }
      } catch (error) {
        console.error('Error loading user churches:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadChurches();
    return () => {
      cancelled = true;
    };
  }, [user, selectChurch]);

  const setCurrentChurch = useCallback(
    (churchId: string) => {
      selectChurch(churchId, userChurches);
    },
    [selectChurch, userChurches],
  );

  return (
    <ChurchContext.Provider
      value={{ currentChurch, currentRole, userChurches, setCurrentChurch, loading }}
    >
      {children}
    </ChurchContext.Provider>
  );
};

export const useChurch = () => {
  const context = useContext(ChurchContext);
  if (context === undefined) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
};
