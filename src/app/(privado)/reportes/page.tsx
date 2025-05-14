"use client";
import React from "react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { format, startOfDay, endOfDay } from "date-fns";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';
import { Switch, Menu } from '@headlessui/react';
import { ChevronUpIcon, ChevronDownIcon, ArrowsUpDownIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from '@heroicons/react/24/outline';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Movement {
  id: string;
  type: "ingreso" | "egreso";
  amount: number;
  description: string;
  date: Date;
  user: string;
  eliminado: boolean;
  categoria?: string;
  nota?: string;
}

export default function ReportesPage() {
  const { user, role } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
  const [tooltip, setTooltip] = useState<{ open: boolean; text: string; x: number; y: number }>({ open: false, text: '', x: 0, y: 0 });
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    let constraints = [];

    // Filtros de fecha
    if (startDate) {
      constraints.push(where('date', '>=', startOfDay(new Date(startDate))));
    }
    if (endDate) {
      constraints.push(where('date', '<=', endOfDay(new Date(endDate))));
    }

    // Otros filtros
    if (selectedType !== 'todos') {
      constraints.push(where('type', '==', selectedType));
    }
    if (selectedCategory !== 'todos') {
      constraints.push(where('categoria', '==', selectedCategory));
    }
    constraints.push(where('eliminado', '==', showDeleted));

    // El orderBy de 'date' debe ir después de los where de rango
    constraints.push(orderBy('date', 'asc'));

    const q = query(collection(db, 'movements'), ...constraints);

    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date ? doc.data().date.toDate() : new Date(),
      eliminado: doc.data().eliminado || false,
    })) as Movement[];

    // Búsqueda en nota, descripción, usuario
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      data = data.filter(m =>
        m.description.toLowerCase().includes(search) ||
        m.nota?.toLowerCase().includes(search) ||
        m.user.toLowerCase().includes(search)
      );
    }
    setMovements(data);
    setFilteredMovements(data);
    setCurrentPage(1);
    setLoading(false);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredMovements.map(m => ({
      Fecha: format(m.date, 'dd/MM/yyyy'),
      Tipo: m.type === 'ingreso' ? 'Ingreso' : 'Egreso',
      Monto: m.amount,
      Categoría: m.categoria || '-',
      Nota: m.nota || '-',
      Descripción: m.description,
      Usuario: m.user,
      Estado: m.eliminado ? 'Eliminado' : 'Activo'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `reporte_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const fechaHora = now.toLocaleString();

    // Título y descripción
    doc.setFontSize(16);
    doc.text("Reporte de Movimientos", 14, 15);
    doc.setFontSize(10);
    doc.text(`Exportado el: ${fechaHora}`, 14, 22);


    // Tabla de datos
    autoTable(doc, {
      startY: 28,
      head: [[
        "Tipo", "Monto", "Categoría", "Nota", "Descripción", "Fecha"
      ]],
      body: filteredMovements.map(m => [
        m.type === "ingreso" ? "Ingreso" : "Egreso",
        `$${m.amount.toFixed(2)}`,
        m.categoria || "-",
        m.nota || "-",
        m.description,
        format(m.date, "dd/MM/yyyy")
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [55, 65, 81] },
    });

    // Tabla de totales
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Total Ingresos', 'Total Egresos', 'Saldo']],
      body: [[
        `$${totalIngresos.toFixed(2)}`,
        `$${totalEgresos.toFixed(2)}`,
        `$${saldo.toFixed(2)}`
      ]],
      styles: { fontSize: 11, halign: 'center' },
      headStyles: { fillColor: [55, 65, 81] },
      theme: 'grid'
    });

    doc.save(`reporte_${now.toISOString().slice(0, 10)}.pdf`);
  };

  const handleTooltip = (e: React.MouseEvent, text: string) => {
    setTooltip({ open: true, text, x: e.clientX, y: e.clientY });
  };
  const closeTooltip = () => setTooltip({ open: false, text: '', x: 0, y: 0 });

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('todos');
    setSelectedCategory('todos');
    setShowDeleted(false);
    setSearchTerm('');
    setMovements([]);
    setFilteredMovements([]);
    setCurrentPage(1);
    setHasSearched(false);
  };

  const sortedMovements = [...filteredMovements].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    if (sortConfig.key === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }

    const aValue = a[sortConfig.key as keyof Movement];
    const bValue = b[sortConfig.key as keyof Movement];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedMovements.length / rowsPerPage);
  const paginatedMovements = sortedMovements.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalesBase = filteredMovements.filter(m => showDeleted ? m.eliminado : !m.eliminado);
  const totalIngresos = totalesBase.filter(m => m.type === 'ingreso').reduce((acc, curr) => acc + curr.amount, 0);
  const totalEgresos = totalesBase.filter(m => m.type === 'egreso').reduce((acc, curr) => acc + curr.amount, 0);
  const saldo = totalIngresos - totalEgresos;

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <ProtectedRoute>
      <div className="bg-gray-900 p-2 sm:p-6">
        {/* Filtros */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value && new Date(endDate) <= new Date(e.target.value)) {
                    const nextDay = new Date(e.target.value);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setEndDate(nextDay.toISOString().slice(0, 10));
                  }
                }}
                className="w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                min={startDate ? (() => { const nextDay = new Date(startDate); nextDay.setDate(nextDay.getDate() + 1); return nextDay.toISOString().slice(0, 10); })() : undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'todos' | 'ingreso' | 'egreso')}
                className="w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              >
                <option value="todos">Todos</option>
                <option value="ingreso">Ingresos</option>
                <option value="egreso">Egresos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              >
                <option value="todos">Todas</option>
                <option value="Diezmo">Diezmo</option>
                <option value="Ofrenda">Ofrenda</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="mt-2 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en descripción, nota o usuario..."
                className="w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={handleSearch}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
            {role === 'admin' && (
              <div className="flex items-center flex-wrap gap-4 mb-4 gap-2 mt-6">
                <label className="flex items-center space-x-2 text-gray-200">
                  <Switch
                    checked={showDeleted}
                    onChange={setShowDeleted}
                    className={`$${showDeleted ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`$${showDeleted ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <span>Mostrar Eliminados</span>
                </label>
              </div>
            )}
              {/* Botones de exportación */}
              {filteredMovements.length > 0 && (
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-4 items-end">
                  <button
                    onClick={handleExportExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition cursor-pointer w-full sm:w-auto"
                  >
                    Exportar a Excel
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition cursor-pointer w-full sm:w-auto"
                  >
                    Exportar a PDF
                  </button>
                </div>
              )}
            </div>
          </div>

        {/* Totales y tabla solo si hasSearched es true */}
        {hasSearched && (
          <>
            {/* Totales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-5 mb-4 sm:mb-8">
              <div className="bg-gray-800 border border-gray-700 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-400">Total Ingresos</dt>
                  <dd className="mt-1 text-3xl font-bold text-green-400">${totalIngresos.toFixed(2)}</dd>
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-400">Total Egresos</dt>
                  <dd className="mt-1 text-3xl font-bold text-red-400">${totalEgresos.toFixed(2)}</dd>
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-400">Saldo</dt>
                  <dd className={`mt-1 text-3xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>${saldo.toFixed(2)}</dd>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-gray-800 border border-gray-700 shadow rounded-lg">
              <div className="px-2 sm:px-4 py-2 sm:py-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700 text-xs sm:text-sm">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer ${sortConfig.key === 'type' ? 'text-indigo-400' : 'text-gray-200'}`}
                            onClick={() => handleSort('type')}>
                          Tipo <ArrowsUpDownIcon className="inline h-4 w-4 mb-1" />
                          {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="inline h-4 w-4" /> : <ChevronDownIcon className="inline h-4 w-4" />)}
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer ${sortConfig.key === 'amount' ? 'text-indigo-400' : 'text-gray-200'}`}
                            onClick={() => handleSort('amount')}>
                          Monto <ArrowsUpDownIcon className="inline h-4 w-4 mb-1" />
                          {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="inline h-4 w-4" /> : <ChevronDownIcon className="inline h-4 w-4" />)}
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer ${sortConfig.key === 'categoria' ? 'text-indigo-400' : 'text-gray-200'}`}
                            onClick={() => handleSort('categoria')}>
                          Categoría <ArrowsUpDownIcon className="inline h-4 w-4 mb-1" />
                          {sortConfig.key === 'categoria' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="inline h-4 w-4" /> : <ChevronDownIcon className="inline h-4 w-4" />)}
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer ${sortConfig.key === 'nota' ? 'text-indigo-400' : 'text-gray-200'}`}
                            onClick={() => handleSort('nota')}>
                          Nota <ArrowsUpDownIcon className="inline h-4 w-4 mb-1" />
                          {sortConfig.key === 'nota' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="inline h-4 w-4" /> : <ChevronDownIcon className="inline h-4 w-4" />)}
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer ${sortConfig.key === 'description' ? 'text-indigo-400' : 'text-gray-200'}`}
                            onClick={() => handleSort('description')}>
                          Descripción <ArrowsUpDownIcon className="inline h-4 w-4 mb-1" />
                          {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="inline h-4 w-4" /> : <ChevronDownIcon className="inline h-4 w-4" />)}
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer ${sortConfig.key === 'date' ? 'text-indigo-400' : 'text-gray-200'}`}
                            onClick={() => handleSort('date')}>
                          Fecha <ArrowsUpDownIcon className="inline h-4 w-4 mb-1" />
                          {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="inline h-4 w-4" /> : <ChevronDownIcon className="inline h-4 w-4" />)}
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer ${sortConfig.key === 'user' ? 'text-indigo-400' : 'text-gray-200'}`}
                            onClick={() => handleSort('user')}>
                          Usuario <ArrowsUpDownIcon className="inline h-4 w-4 mb-1" />
                          {sortConfig.key === 'user' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="inline h-4 w-4" /> : <ChevronDownIcon className="inline h-4 w-4" />)}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {paginatedMovements.map((movement) => (
                        <tr key={movement.id} className={movement.eliminado ? 'opacity-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {movement.type === 'ingreso' ? (
                              <ArrowUpIcon className="h-5 w-5 text-green-400" />
                            ) : (
                              <ArrowDownIcon className="h-5 w-5 text-red-400" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={movement.type === 'ingreso' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                              ${movement.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-200">{movement.categoria || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-200">
                            {movement.categoria === 'Otro' ? (
                              (movement.nota && movement.nota.length > 25) ? (
                                <>
                                  {movement.nota.slice(0, 25)}...
                                  <EyeIcon
                                    className="inline h-4 w-4 ml-1 text-indigo-400 cursor-pointer"
                                    onMouseEnter={e => handleTooltip(e, movement.nota!)}
                                    onMouseLeave={closeTooltip}
                                  />
                                </>
                              ) : (movement.nota || '-')
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-200">
                            {movement.description.length > 25 ? (
                              <>
                                {movement.description.slice(0, 25)}...
                                <EyeIcon
                                  className="inline h-4 w-4 ml-1 text-indigo-400 cursor-pointer"
                                  onMouseEnter={e => handleTooltip(e, movement.description)}
                                  onMouseLeave={closeTooltip}
                                />
                              </>
                            ) : movement.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-200">{format(movement.date, 'dd/MM/yyyy')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-400">{movement.user}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              movement.eliminado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {movement.eliminado ? 'Eliminado' : 'Activo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Paginación y selector de filas por página debajo de la tabla, bien alineados */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-2 sm:mt-4 gap-2">
                  {/* Texto de rango */}
                  <span className="text-gray-300 text-sm mx-2">
                    Mostrando del {(currentPage - 1) * rowsPerPage + 1} al {Math.min(currentPage * rowsPerPage, filteredMovements.length)} de {filteredMovements.length} entradas
                  </span>
                  {/* Paginador */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`px-2 py-1 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 cursor-pointer'}`}
                      title="Primera"
                    >«</button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`px-2 py-1 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 cursor-pointer'}`}
                      title="Anterior"
                    >‹</button>
                    {/* Números de página */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      )
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && page - arr[idx - 1] > 1 && <span className="px-1 text-gray-400">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-full ${currentPage === page ? 'bg-white text-gray-900 font-bold' : 'bg-gray-800 text-gray-200 hover:bg-gray-600 cursor-pointer'}`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-2 py-1 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 cursor-pointer'}`}
                      title="Siguiente"
                    >›</button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-2 py-1 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 cursor-pointer'}`}
                      title="Última"
                    >»</button>
                  </div>
                  {/* Selector de filas por página */}
                  <div>
                    <select
                      value={rowsPerPage}
                      onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="rounded-md border-gray-600 bg-gray-900 text-gray-100 px-3 py-2 cursor-pointer"
                    >
                      {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tooltip flotante para texto largo */}
        {tooltip.open && (
          <div
            className="fixed z-50 px-3 py-2 bg-gray-900 text-gray-100 rounded shadow-lg border border-gray-700 text-xs sm:text-sm max-w-xs"
            style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
          >
            {tooltip.text}
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
} 