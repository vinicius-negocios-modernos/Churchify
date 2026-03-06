import React from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  // Placeholder data for the SaaS layout demonstration
  const stats = [
    { label: 'Cultos Analisados', value: '12', icon: <CheckCircle2 className="text-green-500" /> },
    { label: 'Cultos Pendentes', value: '3', icon: <AlertCircle className="text-yellow-500" /> },
    { label: 'Tempo Economizado', value: '18h', icon: <Clock className="text-indigo-500" /> },
  ];

  const pendingServices = [
    { id: 1, unit: 'Campos 85', date: 'Domingo, 12 Nov', time: '19:30', status: 'Pendente' },
    { id: 2, unit: 'Campos 153', date: 'Domingo, 12 Nov', time: '19:00', status: 'Pendente' },
    { id: 3, unit: 'Campos 85', date: 'Quarta, 08 Nov', time: '20:00', status: 'Atrasado' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500">Acompanhe o status de processamento dos cultos.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Tasks Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Próximas Tarefas
          </h2>
          <Link to="/library" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingServices.map((service) => (
            <div key={service.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-2 h-12 bg-indigo-500 rounded-full"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{service.date} - {service.time}</h3>
                  <p className="text-sm text-gray-500">{service.unit}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  service.status === 'Atrasado' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {service.status}
                </span>
                <Link 
                  to="/new-episode" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-indigo-600"
                  title="Processar Culto"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          ))}
        </div>
        {pendingServices.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-200 mb-2" />
            <p>Tudo em dia! Nenhum culto pendente.</p>
          </div>
        )}
      </div>
    </div>
  );
};