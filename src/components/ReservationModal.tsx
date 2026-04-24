import React, { useState, useEffect } from 'react';
import { format, parseISO, setHours, setMinutes, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Room, Reservation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Calendar as CalendarIcon, User, Building2, AlignLeft, Trash2 } from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: Partial<Reservation>) => void;
  onDelete?: (id: string) => void;
  selectedRoomId?: string;
  selectedTime?: Date;
  existingReservation?: Reservation;
  rooms: Room[];
  currentUserId?: string;
}

export default function ReservationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedRoomId,
  selectedTime,
  existingReservation,
  rooms,
  currentUserId
}: ReservationModalProps) {
  const [title, setTitle] = useState('');
  const [userName, setUserName] = useState('');
  const [organization, setOrganization] = useState('');
  const [roomId, setRoomId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (existingReservation) {
      setTitle(existingReservation.title);
      setUserName(existingReservation.userName);
      setOrganization(existingReservation.organization || '');
      setRoomId(existingReservation.roomId);
      setStartTime(format(parseISO(existingReservation.startTime), "HH:mm"));
      setEndTime(format(parseISO(existingReservation.endTime), "HH:mm"));
    } else {
      setTitle('');
      setUserName('');
      setOrganization('');
      setRoomId(selectedRoomId || '');
      if (selectedTime) {
        setStartTime(format(selectedTime, "HH:mm"));
        const end = new Date(selectedTime);
        end.setHours(end.getHours() + 1);
        setEndTime(format(end, "HH:mm"));
      }
    }
  }, [isOpen, existingReservation, selectedRoomId, selectedTime]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert HH:mm to Full ISO
    const dateRef = selectedTime || (existingReservation ? parseISO(existingReservation.startTime) : new Date());
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startObj = setMinutes(setHours(dateRef, startH), startM);
    const endObj = setMinutes(setHours(dateRef, endH), endM);

    if (differenceInMinutes(endObj, startObj) <= 0) {
      alert("La hora de fin debe ser posterior a la de inicio");
      return;
    }

    onSave({
      title,
      userName,
      organization,
      roomId,
      roomName: rooms.find(r => r.id === roomId)?.name || '',
      startTime: startObj.toISOString(),
      endTime: endObj.toISOString(),
    });
  };

  const isOwner = existingReservation && currentUserId === existingReservation.userId;
  const isNew = !existingReservation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {existingReservation ? 'Detalles de Reserva' : 'Nueva Reserva'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Título del evento</label>
            <input
              required
              disabled={!isNew && !isOwner}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50/50 disabled:bg-slate-50 text-sm font-medium transition-all"
              placeholder="Ej: Sesión de Brainstorming"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sala</label>
              <select
                disabled={!isNew && !isOwner}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-600 bg-slate-50/50 text-sm font-medium"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
              >
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Responsable</label>
              <input
                required
                disabled={!isNew && !isOwner}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-600 bg-slate-50/50 text-sm font-medium"
                placeholder="Persona a cargo"
                value={userName}
                onChange={e => setUserName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hora Inicio</label>
              <input
                type="time"
                required
                disabled={!isNew && !isOwner}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-600 bg-slate-50/50 text-sm font-medium"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hora Fin</label>
              <input
                type="time"
                required
                disabled={!isNew && !isOwner}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-600 bg-slate-50/50 text-sm font-medium"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            {isOwner && onDelete && (
              <button
                type="button"
                onClick={() => existingReservation && onDelete(existingReservation.id)}
                className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            
            {(isNew || isOwner) ? (
              <button
                type="submit"
                className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
              >
                {existingReservation ? 'Guardar Cambios' : 'Confirmar Reserva'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-200 transition-all"
              >
                Cerrar
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
