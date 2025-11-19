
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Chrome } from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Churchify Manager</h1>
        <p className="text-gray-500 mb-8">Gestão de Conteúdo - Campos 85 & 153</p>

        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 text-gray-700 font-bold py-4 px-6 rounded-xl transition-all group"
        >
          <Chrome className="w-5 h-5 group-hover:text-indigo-600" />
          Entrar com Google
        </button>
        <p className="text-xs text-gray-400 mt-6">Acesso restrito à equipe de mídia.</p>
      </div>
    </div>
  );
};
