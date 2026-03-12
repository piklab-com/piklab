import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { generatePostingSchedule } from '../../services/aiService';

interface SmartCalendarProps {
  tasks: any[];
  brand: any;
  onUpdateTask: (taskId: string, updates: any) => void;
}

export const SmartCalendar: React.FC<SmartCalendarProps> = ({ tasks, brand, onUpdateTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const approvedTasks = tasks.filter(t => t.status === 'approved');
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 })
  });

  const handleAutoSchedule = async () => {
    setIsGenerating(true);
    try {
      const schedule = await generatePostingSchedule(approvedTasks, brand);
      for (const item of schedule) {
        await onUpdateTask(item.taskId, { scheduledDate: item.scheduledDate, scheduleReason: item.reason });
      }
    } catch (error) {
      console.error("Scheduling error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(t => t.scheduledDate && isSameDay(new Date(t.scheduledDate), day));
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
            <CalendarIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Akıllı İçerik Takvimi</h2>
            <p className="text-sm text-gray-500">Yapay zeka destekli yayınlama planı</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 rounded-2xl p-1">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-white rounded-xl smooth-transition"><ChevronLeft size={20} /></button>
            <span className="px-4 font-bold text-gray-700 min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: tr })}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-white rounded-xl smooth-transition"><ChevronRight size={20} /></button>
          </div>
          
          <button 
            onClick={handleAutoSchedule}
            disabled={isGenerating || approvedTasks.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 smooth-transition disabled:opacity-50"
          >
            {isGenerating ? <Clock className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Akıllı Planla
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-50 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={idx} 
              onClick={() => setSelectedDay(day)}
              className={`min-h-[140px] p-2 border-r border-b border-gray-50 last:border-r-0 relative group cursor-pointer hover:bg-gray-50/50 smooth-transition ${!isCurrentMonth ? 'bg-gray-50/30' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-bold ${isToday ? 'w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-[10px] font-medium text-gray-600 truncate flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${task.type === 'video' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-gray-400 font-bold pl-1">
                    + {dayTasks.length - 3} daha
                  </div>
                )}
              </div>

              <button className="absolute bottom-2 right-2 p-1 bg-white rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 smooth-transition text-primary">
                <Plus size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Day Detail Sidebar/Modal could go here */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{format(selectedDay, 'd MMMM yyyy', { locale: tr })}</h3>
                  <p className="text-sm text-gray-500">Günlük Plan</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white rounded-xl smooth-transition"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-4">
                {getTasksForDay(selectedDay).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <CalendarIcon size={32} />
                    </div>
                    <p className="text-gray-400 font-medium">Bu gün için planlanmış içerik yok.</p>
                  </div>
                ) : (
                  getTasksForDay(selectedDay).map(task => (
                    <div key={task.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden">
                          {task.assetUrl ? (
                            <img src={task.assetUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Sparkles size={20} /></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{task.title}</h4>
                          <p className="text-xs text-gray-500">{task.type.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.scheduleReason && (
                          <div className="group relative">
                            <Sparkles size={16} className="text-primary cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                              {task.scheduleReason}
                            </div>
                          </div>
                        )}
                        <CheckCircle2 size={18} className="text-green-500" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X = ({ size, ...props }: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
