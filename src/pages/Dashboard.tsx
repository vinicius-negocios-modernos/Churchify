import React from 'react';
import { Calendar, Clock, CheckCircle2, BarChart3, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { EmptyState } from '@/components/EmptyState';
import { StatCard } from '@/components/StatCard';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atras`;
  return formatDate(dateString);
}

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: 'Concluido', className: 'bg-green-100 text-green-700' },
  processing: { label: 'Processando', className: 'bg-blue-100 text-blue-700' },
  draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700' },
  failed: { label: 'Erro', className: 'bg-red-100 text-red-700' },
};

export const Dashboard: React.FC = () => {
  const { stats, recentEpisodes, loading, error, refetch } = useDashboardData();

  if (loading) {
    return (
      <div aria-live="polite" aria-busy={true}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="text-indigo-600 hover:text-indigo-800 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (stats.totalEpisodes === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-8" aria-live="polite" aria-busy={false}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visao Geral</h1>
        <p className="text-gray-500">Acompanhe o status de processamento dos cultos.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<CheckCircle2 className="text-green-500" />}
          label="Total de Episodios"
          value={stats.totalEpisodes}
        />
        <StatCard
          icon={<BarChart3 className="text-indigo-500" />}
          label="Episodios Este Mes"
          value={stats.episodesThisMonth}
        />
        <StatCard
          icon={<Clock className="text-amber-500" />}
          label="Ultimo Processamento"
          value={stats.lastProcessedAt ? formatRelativeDate(stats.lastProcessedAt) : 'Nenhum'}
        />
      </div>

      {/* Recent Episodes Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Episodios Recentes
          </h2>
          <Link to="/library" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentEpisodes.map((episode) => {
            const status = statusConfig[episode.status] ?? statusConfig.draft;
            return (
              <div
                key={episode.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-12 bg-indigo-500 rounded-full" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{episode.title}</h3>
                    <p className="text-sm text-gray-500">
                      {episode.sermon_date
                        ? formatDate(episode.sermon_date)
                        : formatDate(episode.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${status.className}`}
                  >
                    {status.label}
                  </span>
                  <Link
                    to="/new-episode"
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-2 text-gray-500 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                    aria-label={`Ver detalhes de ${episode.title}`}
                    title="Ver detalhes"
                  >
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
