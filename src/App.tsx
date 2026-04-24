/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay, 
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, signInWithGoogle, logout } from './lib/firebase';
import { Reservation, ROOMS, Room } from './types';
import CalendarGrid from './components/CalendarGrid';
import ReservationModal from './components/ReservationModal';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  LogIn, 
  LogOut, 
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function MiniCalendar({ selectedDate, onDateSelect }: { selectedDate: Date, onDateSelect: (d: Date) => void }) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Adjusted for Monday start (es locale)
  const firstDayIdx = (getDay(monthStart) + 6) % 7; 
  const blanks = Array.from({ length: firstDayIdx });

  return (
    <div className="mt-auto pt-8 border-t border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-extrabold text-slate-900 capitalize">
          {format(viewDate, 'MMMM yyyy', { locale: es })}
        </span>
        <div className="flex gap-1">
          <button 
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
          <div key={d} className="text-[9px] font-bold text-slate-400 mb-2">{d}</div>
        ))}
        {blanks.map((_, i) => <div key={`b-${i}`} />)}
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);
          return (
            <button
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={`text-[10px] h-7 w-7 flex items-center justify-center rounded-lg transition-all
                ${isSelected ? 'bg-slate-900 text-white font-bold shadow-sm' : 
                  isTodayDay ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<Date | undefined>();
  const [editingReservation, setEditingReservation] = useState<Reservation | undefined>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    const q = query(
      collection(db, 'reservations'),
      where('startTime', '>=', start.toISOString()),
      where('startTime', '<=', end.toISOString())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
      setReservations(resData);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const handleDayChange = (direction: 'next' | 'prev') => {
    setSelectedDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  const handleSlotClick = (roomId: string, hour: number) => {
    if (!user) {
      alert("Por favor, inicia sesión para realizar una reserva.");
      return;
    }
    const time = new Date(selectedDate);
    time.setHours(hour, 0, 0, 0);
    setSelectedRoomId(roomId);
    setSelectedTime(time);
    setEditingReservation(undefined);
    setIsModalOpen(true);
  };

  const handleReservationClick = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setIsModalOpen(true);
  };

  const handleSaveReservation = async (data: Partial<Reservation>) => {
    if (!user) return;

    try {
      if (editingReservation) {
        const resRef = doc(db, 'reservations', editingReservation.id);
        await updateDoc(resRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, 'reservations'), {
          ...data,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving reservation:", error);
      alert("Error al guardar la reserva. Verifica tu conexión o permisos.");
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta reserva?")) {
      try {
        await deleteDoc(doc(db, 'reservations', id));
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error deleting reservation:", error);
        alert("Error al eliminar la reserva.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium tracking-tight text-slate-900">
            Workspace <span className="text-blue-600 font-extrabold">Booking</span>
          </h1>
        </div>

        <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
          <button 
            onClick={() => handleDayChange('prev')}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-500 active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-5 flex flex-col items-center min-w-[160px]">
            <span className="text-sm font-semibold text-slate-900 capitalize">
              {format(selectedDate, "EEEE, d MMM", { locale: es })}
            </span>
          </div>
          <button 
            onClick={() => handleDayChange('next')}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-500 active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedDate(new Date())}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${isSameDay(selectedDate, new Date()) ? 'text-slate-400 cursor-default' : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}
          >
            Hoy
          </button>
          
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-900">{user.displayName}</p>
                <button onClick={logout} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors">Salir</button>
              </div>
              <img src={user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm" />
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              <LogIn size={16} />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[260px] bg-white border-r border-slate-200 p-6 hidden md:flex flex-col gap-10 flex-shrink-0">
          <div>
            <h2 className="text-[10px] uppercase tracking-[1.5px] text-slate-400 font-extrabold mb-5 uppercase">Mi Agenda</h2>
            <div className="space-y-4">
              {reservations.filter(r => r.userId === user?.uid).slice(0, 3).map(r => (
                <div key={r.id} className="text-sm border-l-2 border-blue-600 pl-3">
                  <div className="font-bold text-slate-900">{format(parseISO(r.startTime), 'HH:mm')} • {r.roomName}</div>
                  <div className="text-slate-500 text-xs truncate">{r.title}</div>
                </div>
              ))}
              {reservations.filter(r => r.userId === user?.uid).length === 0 && (
                <div className="text-xs text-slate-400 italic">No tienes reservas hoy</div>
              )}
            </div>
          </div>

          {/* Functional Mini Calendar */}
          <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </aside>

        {/* Calendar Content */}
        <main className="flex-1 p-8 overflow-hidden bg-slate-50">
          <div className="h-full flex flex-col">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                Disponibilidad
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-tighter ring-1 ring-emerald-200">En vivo</span>
              </h2>
              
              <button 
                onClick={() => {
                  if(!user) { alert("Inicia sesión para reservar"); return; }
                  setEditingReservation(undefined);
                  setSelectedRoomId(ROOMS[0].id);
                  setSelectedTime(new Date());
                  setIsModalOpen(true);
                }}
                className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 shadow-md transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>Nueva Reserva</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <CalendarGrid 
                selectedDate={selectedDate}
                rooms={ROOMS}
                reservations={reservations}
                onSlotClick={handleSlotClick}
                onReservationClick={handleReservationClick}
              />
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <ReservationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveReservation}
            onDelete={handleDeleteReservation}
            selectedRoomId={selectedRoomId}
            selectedTime={selectedTime}
            existingReservation={editingReservation}
            rooms={ROOMS}
            currentUserId={user?.uid}
          />
        )}
      </AnimatePresence>

      <button 
        onClick={() => {
          if(!user) { alert("Inicia sesión para reservar"); return; }
          setEditingReservation(undefined);
          setSelectedRoomId(ROOMS[0].id);
          setSelectedTime(new Date());
          setIsModalOpen(true);
        }}
        className="flex md:hidden bg-slate-900 text-white p-4 rounded-full shadow-2xl fixed bottom-6 right-6 z-40 active:scale-90 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

