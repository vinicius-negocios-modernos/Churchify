
import { addDays, format, getDay, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ServiceEvent {
  id: string; // ID Composto: campus_data_hora
  campusId: 'campos85' | 'campos153';
  date: Date;
  time: string;
  formattedDate: string;
  status: 'pending' | 'published' | 'future';
  weekDay: string;
}

// Configurações Fixas das Igrejas
export const CHURCH_CONFIG = {
  campos85: {
    name: 'Campos 85',
    startDate: '2023-01-01', // Ajuste conforme necessário
    schedule: [
      { day: 0, times: ['08:00', '10:30', '17:00', '19:30'] }, // Domingo (0)
      { day: 3, times: ['20:00'] } // Quarta (3)
    ]
  },
  campos153: {
    name: 'Campos 153',
    startDate: '2023-06-01', // Ajuste conforme necessário
    schedule: [
      { day: 0, times: ['10:00', '19:00'] }, // Domingo
      { day: 3, times: ['20:00'] } // Quarta
    ]
  }
};

/**
 * Gera todos os cultos possíveis em um intervalo de datas
 */
export const generateSchedule = (campusId: 'campos85' | 'campos153', daysLimit = 60): ServiceEvent[] => {
  const config = CHURCH_CONFIG[campusId];
  const events: ServiceEvent[] = [];
  const today = new Date();
  const start = addDays(today, -daysLimit); // Gera dos últimos X dias até hoje

  let current = start;
  const end = today; // Até hoje (não mostra futuros por padrão, ou podemos mudar)

  while (isBefore(current, addDays(end, 1))) {
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
          formattedDate: format(current, "dd 'de' MMMM", { locale: ptBR }),
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
