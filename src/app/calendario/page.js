// src/app/calendario/page.js
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { Icon } from '@iconify/react';

const CalendarioPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const categorias = [
    { value: 'reunion', label: 'Reunión', color: 'purple' },
    { value: 'tarea', label: 'Tarea', color: 'yellow' },
    { value: 'llamada', label: 'Llamada', color: 'orange' },
  ];

  useEffect(() => {
    const loadEvents = () => {
      const storedEvents = JSON.parse(localStorage.getItem('calendario_events') || '[]');
      setEvents(storedEvents);
    };
    loadEvents();
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.fecha);
      return eventDate.toDateString() === dayDate.toDateString();
    });
  };

  const getCategoryColor = (categoria) => {
    const cat = categorias.find(c => c.value === categoria);
    return cat ? cat.color : 'gray';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Calendario</h1>
          <Link href="/calendario/nuevo-evento">
            <button className="px-4 py-2 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition duration-150 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex items-center" style={{backgroundColor: '#23232b'}}>
              <Icon icon="heroicons:plus" className="w-5 h-5 mr-2" />
              Nuevo Evento
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="text-white p-6" style={{backgroundColor: '#6a6a6a'}}>
            <div className="flex justify-between items-center">
              <button onClick={prevMonth} className="p-2 hover:bg-blue-700 rounded">
                <Icon icon="heroicons:chevron-left" className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-blue-700 rounded">
                <Icon icon="heroicons:chevron-right" className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 bg-gray-50">
            {daysOfWeek.map((day) => (
              <div key={day} className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-gray-200 last:border-r-0 ${
                    day ? 'hover:bg-gray-50 cursor-pointer' : ''
                  } ${isToday(day) ? 'bg-blue-50' : ''}`}
                >
                  {day && (
                    <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day}
                    </div>
                  )}
                  {/* Events */}
                  {dayEvents.map(event => {
                    const color = getCategoryColor(event.categoria);
                    return (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded mb-1 text-white"
                        style={{ backgroundColor: color }}
                      >
                        <div className="font-medium">{event.nombre}</div>
                        <div>{event.horaInicio} - {event.horaFin}</div>
                        <div className="capitalize">{event.categoria}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events sidebar */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4" style={{color: '#6a6a6a'}}>Próximos Eventos</h3>
          <div className="space-y-3">
            {events
              .filter(event => new Date(event.fecha) >= new Date())
              .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
              .slice(0, 5)
              .map(event => {
                const color = getCategoryColor(event.categoria);
                return (
                  <div key={event.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: color }}
                    ></div>
                    <div>
                      <p className="font-medium" style={{color: '#6a6a6a'}}>{event.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.fecha).toLocaleDateString('es-ES')}, {event.horaInicio}
                      </p>
                    </div>
                  </div>
                );
              })}
            {events.filter(event => new Date(event.fecha) >= new Date()).length === 0 && (
              <p className="text-sm text-gray-500">No hay eventos próximos</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarioPage;