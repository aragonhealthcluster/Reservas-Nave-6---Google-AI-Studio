export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  title: string;
  userName: string;
  organization: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  capacity?: string;
  color?: string;
}

export const ROOMS: Room[] = [
  { id: 'aula-1', name: 'Aula 1', capacity: '24 plazas', color: '#3b82f6' },
  { id: 'aula-2', name: 'Aula 2', capacity: '12 plazas', color: '#10b981' },
  { id: 'sala-1', name: 'Sala 1', capacity: '8 plazas', color: '#f59e0b' },
  { id: 'sala-2', name: 'Sala 2', capacity: '8 plazas', color: '#ef4444' },
  { id: 'hall', name: 'Hall', capacity: '', color: '#8b5cf6' },
];

export const BUSINESS_HOURS = {
  start: 8,
  end: 20,
};
