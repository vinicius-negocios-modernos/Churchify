
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHURCH_CONFIG, ServiceEvent, generateSchedule } from '../utils/schedule';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { CheckCircle2, Circle, Clock, Calendar, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [events85, setEvents85] = useState<ServiceEvent[]>([]);
  const [events153, setEvents153] = useState<ServiceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega o calendário e verifica no Firebase o que já foi feito
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Gerar calendário virtual (últimos 90 dias)
        const raw85 = generateSchedule('campos85', 90);
        const raw153 = generateSchedule('campos153', 90);

        // 2. Buscar episódios já salvos no Firebase
        // Nota: Em produção com muitos dados, faríamos queries paginadas. 
        // Como são poucos cultos por semana, pegar tudo dos últimos 3 meses é leve.
        const q = query(collection(db, 'episodes')); 
        const querySnapshot = await getDocs(q);
        const doneIds = new Set(querySnapshot.docs.map(doc => doc.id));

        // 3. Atualizar status
        const updateStatus = (events: ServiceEvent[]) => events.map(ev => ({
          ...ev,
          status: doneIds.has(ev.id) ? 'published' : 'pending'
        } as ServiceEvent));

        setEvents85(updateStatus(raw85));
        setEvents153(updateStatus(raw153));
      } catch (err) {
        console.error("Erro ao carregar dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const ServiceCard = ({ event }: { event: ServiceEvent }) => {
    const isDone = event.status === 'published';
    
    return (
      <div 
        onClick={() => navigate(`/editor/${event.campusId}/${event.id}?date=${event.date.toISOString()}&time=${event.time}`)}
        className={clsx(
          "cursor-pointer border rounded-lg p-4 transition-all hover:shadow-md flex items-center justify-between group",
          isDone ? "bg-white border-gray-200 hover:border-green-300" : "bg-white border-l-4 border-l-yellow-400 border-y-gray-100 border-r-gray-100 hover:border-l-yellow-500"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={clsx("p-2 rounded-full", isDone ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600")}>
            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              <Calendar className="w-3 h-3" />
              {event.weekDay}
              <span className="text-gray-300">|</span>
              <Clock className="w-3 h-3" />
              {event.time}
            </div>
            <h4 className="text-gray-900 font-medium">{event.formattedDate}</h4>
            <p className="text-xs text-gray-400 mt-1">
              {isDone ? "Processado e Salvo" : "Aguardando Análise"}
            </p>
          </div>
        </div>
        <ArrowRight className={clsx("w-5 h-5 transition-transform group-hover:translate-x-1", isDone ? "text-gray-300" : "text-indigo-400")} />
      </div>
    );
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Cultos</h1>
          <p className="text-gray-500">Gerencie as análises pendentes de cada unidade.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Coluna Campos 85 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-bold">85</div>
            <h2 className="text-lg font-bold text-gray-800">{CHURCH_CONFIG.campos85.name}</h2>
          </div>
          <div className="space-y-3">
            {events85.map(ev => <ServiceCard key={ev.id} event={ev} />)}
          </div>
        </section>

        {/* Coluna Campos 153 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold">153</div>
            <h2 className="text-lg font-bold text-gray-800">{CHURCH_CONFIG.campos153.name}</h2>
          </div>
          <div className="space-y-3">
            {events153.map(ev => <ServiceCard key={ev.id} event={ev} />)}
          </div>
        </section>
      </div>
    </div>
  );
};
