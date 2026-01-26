
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHURCH_CONFIG, ServiceEvent, generateMonthSchedule } from '../utils/schedule';
import { db, markAsNoMedia, saveEpisode } from '../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { CheckCircle2, Circle, Calendar, ArrowRight, Plus, X, Ban, Filter, ListFilter, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Modal Component para adicionar evento extra
const AddExtraModal = ({ isOpen, onClose, onSave, campusId }: any) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:30');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Criar ID único para o evento extra
      const id = `${campusId}_${date}_${time.replace(':', '')}_EXTRA`;
      const dateObj = parseISO(date);

      // Salvar como "pending" no banco para aparecer na lista
      await saveEpisode(id, {
        campusId,
        date, // YYYY-MM-DD
        time,
        status: 'pending',
        isExtra: true,
        formattedDate: format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        weekDay: format(dateObj, "EEEE", { locale: ptBR }),
      });
      
      onSave();
      onClose();
    } catch (error) {
      alert("Erro ao criar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Adicionar Evento Extra</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
            <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full border rounded-lg p-2" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">
            {loading ? 'Salvando...' : 'Adicionar à Agenda'}
          </button>
        </form>
      </div>
    </div>
  );
};

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const YEARS = [2022, 2023, 2024, 2025, 2026];

type StatusFilterType = 'all' | 'pending' | 'published' | 'no-media';

interface ServiceCardProps {
  event: ServiceEvent;
  onMarkNoMedia: (e: React.MouseEvent, event: ServiceEvent) => void;
  onRevertStatus: (e: React.MouseEvent, event: ServiceEvent) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ event, onMarkNoMedia, onRevertStatus }) => {
  const navigate = useNavigate();
  const isPublished = event.status === 'published';
  const isNoMedia = event.status === 'no-media';
  const isFuture = event.date > new Date();
  
  return (
    <div 
      onClick={() => !isNoMedia && navigate(`/editor/${event.campusId}/${event.id}?date=${event.date.toISOString()}&time=${event.time}`)}
      className={clsx(
        "relative border rounded-lg p-4 transition-all flex items-center justify-between group",
        isNoMedia ? "bg-gray-100 border-gray-200 opacity-75 cursor-default" :
        isPublished ? "bg-white border-gray-200 cursor-pointer hover:border-green-300 hover:shadow-md" :
        isFuture ? "bg-blue-50 border-blue-100 cursor-pointer hover:border-blue-300" : 
        "bg-white border-l-4 border-l-yellow-400 border-y-gray-100 border-r-gray-100 cursor-pointer hover:border-l-yellow-500 hover:shadow-md"
      )}
    >
      {event.isExtra && (
         <span className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">EXTRA</span>
      )}
      
      <div className="flex items-center gap-4">
        <div className={clsx("p-2 rounded-full", 
          isNoMedia ? "bg-gray-200 text-gray-400" :
          isPublished ? "bg-green-100 text-green-600" : 
          isFuture ? "bg-blue-200 text-blue-600" : "bg-yellow-100 text-yellow-600"
        )}>
          {isNoMedia ? <Ban className="w-5 h-5" /> :
           isPublished ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <Calendar className="w-3 h-3" />
            {event.weekDay}
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-600">{event.time}</span>
          </div>
          <h4 className={clsx("font-medium", isNoMedia ? "text-gray-500 line-through" : "text-gray-900")}>
            {event.formattedDate}
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            {isNoMedia ? "Sem Mídia Disponível" : 
             isPublished ? "Processado e Salvo" : 
             isFuture ? "Agendado" : "Aguardando Análise"}
          </p>
        </div>
      </div>
      
      {/* Ações */}
      <div className="flex items-center gap-2">
        {isNoMedia && (
          <button
            onClick={(e) => onRevertStatus(e, event)}
            title="Desfazer (Voltar para Pendente)"
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors z-10"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {!isPublished && !isNoMedia && (
           <button 
             onClick={(e) => onMarkNoMedia(e, event)}
             title="Marcar como Sem Mídia"
             className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
           >
             <Ban className="w-4 h-4" />
           </button>
        )}

        {!isNoMedia && (
           <ArrowRight className="w-5 h-5 text-indigo-400 transition-transform group-hover:translate-x-1" />
        )}
      </div>

      {isPublished && <CheckCircle2 className="w-5 h-5 text-gray-300" />}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [events85, setEvents85] = useState<ServiceEvent[]>([]);
  const [events153, setEvents153] = useState<ServiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  
  // Estado do Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCampus, setModalCampus] = useState<'campos85' | 'campos153'>('campos85');

  const refreshData = async () => {
    setLoading(true);
    try {
      // 1. Gerar calendário específico para o Mês/Ano selecionado
      const raw85 = generateMonthSchedule('campos85', selectedYear, selectedMonth); 
      const raw153 = generateMonthSchedule('campos153', selectedYear, selectedMonth);

      // 2. Buscar TUDO que tem no Firebase
      const q = query(collection(db, 'episodes')); 
      const querySnapshot = await getDocs(q);
      
      const firebaseDocs: Record<string, any> = {};
      querySnapshot.forEach(doc => {
        firebaseDocs[doc.id] = doc.data();
      });

      // 3. Função de merge
      const mergeEvents = (generatedEvents: ServiceEvent[], campus: string) => {
        const merged = [...generatedEvents];

        // A. Atualizar status dos eventos gerados
        const finalEvents = merged.map(ev => {
          const fbData = firebaseDocs[ev.id];
          if (fbData) {
            return { ...ev, status: fbData.status };
          }
          return ev;
        });

        // B. Encontrar eventos EXTRAS que pertencem ao Mês/Ano selecionado
        const generatedIds = new Set(generatedEvents.map(e => e.id));
        
        // Prefixo de data para filtrar no banco (YYYY-MM)
        const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
        const datePrefix = `${selectedYear}-${monthStr}`;

        const extraDocs = Object.keys(firebaseDocs).filter(id => 
          id.startsWith(campus) && 
          !generatedIds.has(id) && 
          firebaseDocs[id].isExtra === true &&
          firebaseDocs[id].date.startsWith(datePrefix)
        );

        extraDocs.forEach(id => {
          const data = firebaseDocs[id];
          const dateObj = new Date(data.date);
          finalEvents.push({
            id,
            campusId: data.campusId,
            date: dateObj,
            time: data.time,
            formattedDate: format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
            weekDay: data.weekDay || format(dateObj, "EEEE", { locale: ptBR }),
            status: data.status,
            isExtra: true
          });
        });

        return finalEvents.sort((a, b) => b.date.getTime() - a.date.getTime() || b.time.localeCompare(a.time));
      };

      setEvents85(mergeEvents(raw85, 'campos85'));
      setEvents153(mergeEvents(raw153, 'campos153'));

    } catch (err) {
      console.error("Erro ao carregar dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedMonth, selectedYear]);

  const handleMarkNoMedia = async (e: React.MouseEvent, event: ServiceEvent) => {
    e.stopPropagation();
    // Removido confirm para evitar bloqueio de UI
    try {
        const dateStr = format(event.date, 'yyyy-MM-dd');
        await markAsNoMedia(event.id, event.campusId, dateStr, event.time);
        refreshData();
    } catch(e) {
        console.error(e);
        alert("Erro ao atualizar status");
    }
  };

  // Reverter "Sem Mídia" para "Pendente"
  const handleRevertStatus = async (e: React.MouseEvent, event: ServiceEvent) => {
    e.stopPropagation();
    // Removido confirm para evitar bloqueio de UI
    try {
      await saveEpisode(event.id, { status: 'pending' });
      refreshData();
    } catch(e) {
      console.error(e);
      alert("Erro ao reverter status");
    }
  };

  // Calcular estatísticas para os filtros
  const allEvents = [...events85, ...events153];
  const stats = {
    all: allEvents.length,
    pending: allEvents.filter(e => e.status === 'pending').length,
    published: allEvents.filter(e => e.status === 'published').length,
    noMedia: allEvents.filter(e => e.status === 'no-media').length
  };

  const filterEvents = (events: ServiceEvent[]) => {
    if (statusFilter === 'all') return events;
    return events.filter(e => e.status === statusFilter);
  };

  const filtered85 = filterEvents(events85);
  const filtered153 = filterEvents(events153);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <AddExtraModal 
         isOpen={modalOpen} 
         onClose={() => setModalOpen(false)} 
         campusId={modalCampus} 
         onSave={refreshData} 
      />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Cultos</h1>
          <p className="text-gray-500">Gerencie as análises de cada unidade.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto overflow-x-auto">
          
          {/* Filtros de Status */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
             <button 
               onClick={() => setStatusFilter('all')}
               className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2", statusFilter === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-gray-100")}
             >
               Todos 
               <span className="bg-gray-200 text-gray-600 px-1.5 rounded-full text-[10px] h-5 min-w-5 flex items-center justify-center">{stats.all}</span>
             </button>
             <div className="w-px h-4 bg-gray-300 mx-1"></div>
             <button 
               onClick={() => setStatusFilter('pending')}
               className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2", statusFilter === 'pending' ? "bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100" : "text-gray-500 hover:bg-gray-100")}
             >
               Pendentes
               <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded-full text-[10px] h-5 min-w-5 flex items-center justify-center">{stats.pending}</span>
             </button>
             <button 
               onClick={() => setStatusFilter('published')}
               className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2", statusFilter === 'published' ? "bg-green-50 text-green-700 shadow-sm border border-green-100" : "text-gray-500 hover:bg-gray-100")}
             >
               Feitos
               <span className="bg-green-100 text-green-700 px-1.5 rounded-full text-[10px] h-5 min-w-5 flex items-center justify-center">{stats.published}</span>
             </button>
             <button 
               onClick={() => setStatusFilter('no-media')}
               className={clsx("px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2", statusFilter === 'no-media' ? "bg-gray-100 text-gray-600 shadow-sm border border-gray-200" : "text-gray-500 hover:bg-gray-100")}
             >
               Sem Mídia
               <span className="bg-gray-200 text-gray-500 px-1.5 rounded-full text-[10px] h-5 min-w-5 flex items-center justify-center">{stats.noMedia}</span>
             </button>
          </div>

          {/* Filtro de Data */}
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 ml-auto sm:ml-0">
            <Filter className="w-4 h-4 text-gray-400 ml-2 hidden sm:block" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8"
            >
              {MONTHS.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>
            <div className="w-px h-4 bg-gray-300"></div>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer py-1.5 pl-2 pr-8"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Coluna Campos 85 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-bold">85</div>
                <h2 className="text-lg font-bold text-gray-800">{CHURCH_CONFIG.campos85.name}</h2>
              </div>
              <button 
                onClick={() => { setModalCampus('campos85'); setModalOpen(true); }}
                className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Extra
              </button>
            </div>
            <div className="space-y-3">
              {filtered85.map(ev => (
                <ServiceCard 
                  key={ev.id} 
                  event={ev} 
                  onMarkNoMedia={handleMarkNoMedia} 
                  onRevertStatus={handleRevertStatus} 
                />
              ))}
              {filtered85.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed flex flex-col items-center">
                  <ListFilter className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">Nenhum culto encontrado com este filtro.</p>
                </div>
              )}
            </div>
          </section>

          {/* Coluna Campos 153 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
               <div className="flex items-center gap-3">
                <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold">153</div>
                <h2 className="text-lg font-bold text-gray-800">{CHURCH_CONFIG.campos153.name}</h2>
              </div>
              <button 
                onClick={() => { setModalCampus('campos153'); setModalOpen(true); }}
                className="text-purple-600 hover:bg-purple-50 p-2 rounded-full text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Extra
              </button>
            </div>
            <div className="space-y-3">
              {filtered153.map(ev => (
                <ServiceCard 
                  key={ev.id} 
                  event={ev} 
                  onMarkNoMedia={handleMarkNoMedia} 
                  onRevertStatus={handleRevertStatus} 
                />
              ))}
              {filtered153.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed flex flex-col items-center">
                   <ListFilter className="w-8 h-8 text-gray-300 mb-2" />
                   <p className="text-gray-400 text-sm">Nenhum culto encontrado com este filtro.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
