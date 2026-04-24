import React from 'react';
import { format, addHours, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Room, Reservation, BUSINESS_HOURS } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, User, Building2 } from 'lucide-react';

interface CalendarGridProps {
  selectedDate: Date;
  rooms: Room[];
  reservations: Reservation[];
  onSlotClick: (roomId: string, hour: number) => void;
  onReservationClick: (reservation: Reservation) => void;
}

export default function CalendarGrid({ 
  selectedDate, 
  rooms, 
  reservations, 
  onSlotClick,
  onReservationClick 
}: CalendarGridProps) {
  const hours = Array.from(
    { length: BUSINESS_HOURS.end - BUSINESS_HOURS.start + 1 },
    (_, i) => BUSINESS_HOURS.start + i
  );

  const getReservationsForRoom = (roomId: string) => {
    return reservations.filter(res => res.roomId === roomId);
  };

  const calculatePosition = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const top = (startHour - BUSINESS_HOURS.start) * 60; // 60px per hour
    const height = (endHour - startHour) * 60;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl border border-slate-200" id="calendar-container">
      {/* Rooms Header */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="w-16 flex-shrink-0 border-r border-slate-100 bg-white" />
        {rooms.map(room => (
          <div key={room.id} className="flex-1 py-4 px-4 border-r border-slate-100 last:border-r-0">
            <h3 className="font-bold text-slate-900 text-sm">{room.name}</h3>
            {room.capacity && (
              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                Cap. {room.capacity.split(' ')[0]}
              </span>
            )}
            <div className="mt-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-tight ring-1 ring-emerald-100">
                Disponible
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Content */}
      <div className="flex flex-1 relative overflow-y-auto min-h-[500px]">
        {/* Time Sidebar */}
        <div className="w-16 flex-shrink-0 border-r border-slate-100 bg-white">
          {hours.map(hour => (
            <div key={hour} className="h-[52px] relative">
              <span className="absolute -top-2 left-0 right-0 text-center text-[9px] font-bold text-slate-300 bg-white px-1">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Room Columns */}
        <div className="flex flex-1 relative bg-[#fcfcfd]">
          {rooms.map(room => (
            <div key={room.id} className="flex-1 relative border-r border-slate-100 last:border-r-0 min-w-[150px]">
              {/* Hour Slots */}
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="h-[52px] border-t border-dashed border-slate-100 hover:bg-white transition-colors cursor-pointer first:border-t-0"
                  onClick={() => onSlotClick(room.id, hour)}
                />
              ))}

              {/* Reservations Overlay */}
              <AnimatePresence>
                {getReservationsForRoom(room.id).map(res => {
                  const start = parseISO(res.startTime);
                  const end = parseISO(res.endTime);
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;
                  
                  const top = (startHour - BUSINESS_HOURS.start) * 52;
                  const height = (endHour - startHour) * 52;

                  return (
                    <motion.div
                      key={res.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="absolute left-1 right-1 rounded-md border-l-[3px] p-2 cursor-pointer z-10 transition-all hover:brightness-95 hover:shadow-sm overflow-hidden"
                      style={{ 
                        top: `${top + 2}px`,
                        height: `${height - 4}px`,
                        backgroundColor: '#eff6ff',
                        borderColor: '#3b82f6',
                        color: '#1e40af'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReservationClick(res);
                      }}
                    >
                      <div className="flex flex-col h-full justify-center">
                        <span className="text-[10px] font-bold truncate leading-tight">
                          {res.title}
                        </span>
                        <div className="flex items-center text-[9px] font-medium opacity-80 truncate mt-0.5">
                          <span>{res.userName}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
