import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Politica de Privacidade</h1>
          </div>
          <div className="prose prose-gray text-sm space-y-4">
            <p className="text-gray-600">
              A Politica de Privacidade completa sera disponibilizada em breve. O Churchify coleta apenas os
              dados necessarios para o funcionamento da plataforma, como seu perfil Google e conteudo gerado.
              Seus dados nao sao compartilhados com terceiros.
            </p>
            <p className="text-gray-500 text-xs">Ultima atualizacao: Marzo 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};
