'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface MovementFiltersProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null, categoria: string, search: string) => void;
  movements: any[];
  darkMode?: boolean;
}

export default function MovementFilters({ onFilterChange, movements, darkMode }: MovementFiltersProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Todas');
  const [search, setSearch] = useState<string>('');

  const inputClass = darkMode
    ? 'mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2'
    : 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2';

  const buttonClass = (color: string) =>
    `px-4 py-2 rounded-md text-sm font-semibold transition ${color}`;

  const handleFilter = () => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    onFilterChange(start, end, categoria, search);
  };

  const handleExport = () => {
    const data = movements.map(movement => ({
      Tipo: movement.type === 'ingreso' ? 'Ingreso' : 'Egreso',
      Monto: movement.amount,
      Categoría: movement.categoria || '-',
      Nota: movement.categoria === 'Otro' ? (movement.nota || '-') : '-',
      Descripción: movement.description,
      Fecha: format(movement.date, 'dd/MM/yyyy', { locale: es }),
      Usuario: movement.user
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    XLSX.writeFile(wb, 'movimientos.xlsx');
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setCategoria('Todas');
    setSearch('');
    onFilterChange(null, null, 'Todas', '');
  };

  return (
    <div className="flex flex-wrap gap-4 items-end mb-4">
      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Fecha Inicio</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Fecha Fin</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Categoría</label>
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className={inputClass}
        >
          <option value="Todas">Todas</option>
          <option value="Diezmo">Diezmo</option>
          <option value="Ofrenda">Ofrenda</option>
          <option value="Talento/cocina">Talento/cocina</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Buscar</label>
        <input
          type="text"
          placeholder="Buscar en nota o descripción"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        onClick={handleFilter}
        className={buttonClass('bg-indigo-600 hover:bg-indigo-700 text-white')}
      >
        Filtrar
      </button>
      <button
        onClick={handleExport}
        className={buttonClass('bg-green-600 hover:bg-green-700 text-white')}
      >
        Exportar a Excel
      </button>
      <button
        onClick={handleClear}
        className={buttonClass('bg-gray-600 hover:bg-gray-700 text-white')}
      >
        Limpiar filtros
      </button>
    </div>
  );
} 