import React from 'react';
import { Link } from 'react-router-dom';
import { Mic2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-indigo-50 p-6 rounded-full mb-6">
        <Mic2 className="w-12 h-12 text-indigo-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Nenhum episodio ainda
      </h2>
      <p className="text-gray-500 max-w-md mb-8">
        Crie seu primeiro episodio para comecar a analisar sermoes com
        inteligencia artificial. E rapido e facil!
      </p>
      <Button asChild>
        <Link to="/new-episode" className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Criar Primeiro Episodio
        </Link>
      </Button>
    </div>
  );
};
