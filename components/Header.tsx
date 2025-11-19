import React from 'react';
import { Mic2, Music, Youtube } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Mic2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Churchify</h1>
            <p className="text-xs text-indigo-600 font-medium">Gestão de Conteúdo</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700">
            <Music className="w-4 h-4" />
            <span>Otimizado para Spotify</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-700">
            <Youtube className="w-4 h-4" />
            <span>Integração YouTube</span>
          </div>
        </div>
      </div>
    </header>
  );
};