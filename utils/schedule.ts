
import { addDays, format, getDay, isBefore, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ServiceEvent {
  id: string; // ID Composto: campus_data_hora
  campusId: 'campos85' | 'campos153';
  date: Date;
  time: string;
  formattedDate: string;
  status: 'pending' | 'published' | 'future' | 'no-media';
  weekDay: string;
  isExtra?: boolean; // Marca se é um evento criado manualmente
}

// Configurações Fixas das Igrejas
export const CHURCH_CONFIG = {
  campos85: {
    name: 'Campos 85',
    startDate: '2022-01-09', // Data atualizada para 09/01/2022
    schedule: [
      { day: 0, times: ['08:00', '10:30', '17:00', '19:30'] }, // Domingo (0)
      { day: 3, times: ['20:00'] } // Quarta (3)
    ]
  },
  campos153: {
    name: 'Campos 153',
    startDate: '2024-11-01', // Data atualizada para 01/11/2024
    schedule: [
      { day: 0, times: ['10:00', '19:00'] }, // Domingo
      { day: 3, times: ['20:00'] } // Quarta
    ]
  }
};

/**
 * Gera os cultos de um mês específico para um campus
 */
export const generateMonthSchedule = (campusId: 'campos85' | 'campos153', year: number, month: number): ServiceEvent[] => {
  const config = CHURCH_CONFIG[campusId];
  const events: ServiceEvent[] = [];
  
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(start);
  const campusStart = parseISO(config.startDate);

  let current = start;

  while (current <= end) {
    // Não gerar se for antes do início das transmissões
    if (isBefore(current, campusStart)) {
        current = addDays(current, 1);
        continue;
    }

    const weekDay = getDay(current);
    
    // Verifica se tem culto neste dia da semana
    const rules = config.schedule.find(r => r.day === weekDay);
    
    if (rules) {
      rules.times.forEach(time => {
        const dateStr = format(current, 'yyyy-MM-dd');
        const id = `${campusId}_${dateStr}_${time.replace(':', '')}`;
        
        events.push({
          id,
          campusId,
          date: new Date(current),
          time,
          formattedDate: format(current, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          weekDay: format(current, "EEEE", { locale: ptBR }),
          status: 'pending' // Será atualizado ao cruzar com Firebase
        });
      });
    }
    
    current = addDays(current, 1);
  }

  // Ordenar do mais recente para o mais antigo
  return events.sort((a, b) => b.date.getTime() - a.date.getTime() || b.time.localeCompare(a.time));
};
