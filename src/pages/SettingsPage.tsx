import React from 'react';
import { Settings, Clock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="bg-gray-100 p-4 rounded-2xl mb-6">
        <Settings className="w-12 h-12 text-gray-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuracoes</h1>
      <p className="text-gray-500 max-w-md mb-6">
        Em breve voce podera gerenciar seu perfil, membros da igreja, plano de assinatura e preferencias.
      </p>
      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
        <Clock className="w-4 h-4" />
        Em desenvolvimento
      </div>
    </div>
  );
};
