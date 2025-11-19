import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mic2, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError("Falha ao conectar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left Side - Branding */}
      <div className="md:w-1/2 bg-indigo-900 relative overflow-hidden flex flex-col justify-between p-12 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <Mic2 className="w-8 h-8 text-indigo-300" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Churchify</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Transforme cultos em conteúdo digital em segundos.
          </h1>
          <p className="text-indigo-200 text-lg max-w-md">
            A plataforma de IA para igrejas que automatiza a criação de descrições, cortes e thumbnails para Spotify e YouTube.
          </p>
        </div>

        <div className="relative z-10 space-y-4 mt-12">
           <div className="flex items-center gap-3">
             <CheckCircle2 className="text-green-400" />
             <span className="font-medium">Geração de Show Notes com IA</span>
           </div>
           <div className="flex items-center gap-3">
             <CheckCircle2 className="text-green-400" />
             <span className="font-medium">Identificação de Cortes Virais</span>
           </div>
           <div className="flex items-center gap-3">
             <CheckCircle2 className="text-green-400" />
             <span className="font-medium">Criação de Thumbnails Automáticas</span>
           </div>
        </div>

        {/* Abstract Circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-800 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-600 rounded-full opacity-30 blur-3xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="mt-2 text-gray-600">Faça login para gerenciar o conteúdo da sua igreja.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
              ) : (
                <>
                   <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                   <span>Continuar com Google</span>
                   <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};