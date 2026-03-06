import React from 'react';
import { Library, Clock } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="bg-indigo-100 p-4 rounded-2xl mb-6">
        <Library className="w-12 h-12 text-indigo-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Biblioteca</h1>
      <p className="text-gray-500 max-w-md mb-6">
        Em breve voce podera acessar todos os seus episodios gerados, filtrar por data, status e muito mais.
      </p>
      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
        <Clock className="w-4 h-4" />
        Em desenvolvimento
      </div>
    </div>
  );
};
