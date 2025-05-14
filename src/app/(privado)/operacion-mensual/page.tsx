"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ArrowUpIcon, ArrowDownIcon, ChevronUpIcon, ChevronDownIcon, ArrowsUpDownIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "react-hot-toast";
import { Switch } from '@headlessui/react';
import Header from '@/components/Header';

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

export default function OperacionMensualPage() {
  const { user, role } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newMovement, setNewMovement] = useState({
    type: 'ingreso',
    amount: '',
    categoria: 'Diezmo',
    nota: '',
    description: '',
  });
  const [editMovement, setEditMovement] = useState<Movement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<{movement: Movement, action: 'delete' | 'restore'} | null>(null);
  const [filterCategoria, setFilterCategoria] = useState('Todos');
  const [filterSearch, setFilterSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
  const [tooltip, setTooltip] = useState<{ open: boolean; text: string; x: number; y: number }>({ open: false, text: '', x: 0, y: 0 });

  useEffect(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const q = query(collection(db, 'movements'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date ? doc.data().date.toDate() : new Date(),
        eliminado: doc.data().eliminado || false,
      })) as Movement[];
      // Solo movimientos del mes actual
      setMovements(data.filter(m => m.date >= monthStart && m.date <= monthEnd));
    });
    return () => unsubscribe();
  }, []);

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'movements'), {
        ...newMovement,
        amount: Number(newMovement.amount),
        date: serverTimestamp(),
        user: user?.email,
        eliminado: false,
      });
      setShowModal(false);
      setNewMovement({ type: 'ingreso', amount: '', categoria: 'Diezmo', nota: '', description: '' });
      toast.success('Movimiento registrado exitosamente');
    } catch (error) {
      toast.error('Error al registrar el movimiento');
      console.error(error);
    }
  };

  const handleEditMovement = (movement: Movement) => {
    setEditMovement(movement);
    setShowEditModal(true);
  };

  const handleUpdateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMovement) return;
    try {
      const docRef = doc(db, 'movements', editMovement.id);
      await updateDoc(docRef, {
        type: editMovement.type,
        amount: Number(editMovement.amount),
        categoria: editMovement.categoria,
        nota: editMovement.categoria === 'Otro' ? editMovement.nota : '',
        description: editMovement.description,
      });
      setShowEditModal(false);
      setEditMovement(null);
      toast.success('Movimiento actualizado');
    } catch (error) {
      toast.error('Error al actualizar');
      console.error(error);
    }
  };

  const handleDeleteRestoreClick = (movement: Movement, action: 'delete' | 'restore') => {
    setMovementToDelete({ movement, action });
    setShowConfirmModal(true);
  };

  const handleConfirmDeleteRestore = async () => {
    if (!movementToDelete) return;
    try {
      const docRef = doc(db, 'movements', movementToDelete.movement.id);
      await updateDoc(docRef, { eliminado: movementToDelete.action === 'delete' });
      toast.success(movementToDelete.action === 'delete' ? 'Movimiento eliminado' : 'Movimiento restaurado');
      setShowConfirmModal(false);
      setMovementToDelete(null);
    } catch (error) {
      toast.error('Error al actualizar');
      console.error(error);
    }
  };

  // Filtrado y ordenamiento
  const filteredMovements = movements.filter(m => {
    // Filtro por eliminados
    if (role === 'admin') {
      if (showDeleted && !m.eliminado) return false;
      if (!showDeleted && m.eliminado) return false;
    } else {
      if (m.eliminado) return false;
    }
    // Filtro por categoría
    if (filterCategoria !== 'Todos' && m.categoria !== filterCategoria) return false;
    // Filtro por búsqueda
    if (filterSearch.trim() !== '') {
      const search = filterSearch.toLowerCase();
      if (!(m.description.toLowerCase().includes(search) || (m.nota?.toLowerCase().includes(search) ?? false))) return false;
    }
    return true;
  });

  // Ordenamiento
  const sortedMovements = [...filteredMovements].sort((a, b) => {
    if (!sortConfig.key) return 0;
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

  // Paginación
  const totalPages = Math.ceil(sortedMovements.length / rowsPerPage);
  const paginatedMovements = sortedMovements.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Totales filtrados (ahora dependen de showDeleted)
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

  const handleTooltip = (e: React.MouseEvent, text: string) => {
    setTooltip({ open: true, text, x: e.clientX, y: e.clientY });
  };
  const closeTooltip = () => setTooltip({ open: false, text: '', x: 0, y: 0 });

  return (
    <ProtectedRoute>
      <div className="bg-gray-900 w-full p-2 sm:p-6">
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
              <dt className="text-sm font-medium text-gray-400">Saldo Actual</dt>
              <dd className={`mt-1 text-3xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>${saldo.toFixed(2)}</dd>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 shadow rounded-lg">
          <div className="px-2 sm:px-4 py-2 sm:py-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-200">Movimientos del Mes</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition cursor-pointer w-48 sm:w-auto"
              >
                Nuevo Movimiento
              </button>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-4 items-start sm:items-end ">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Categoría</label>
                <select
                  value={filterCategoria}
                  onChange={e => { setFilterCategoria(e.target.value); setCurrentPage(1); }}
                  className="rounded-md border-gray-600 bg-gray-900 text-gray-100 px-3 py-2"
                >
                  <option value="Todos">Todas</option>
                  <option value="Diezmo">Diezmo</option>
                  <option value="Ofrenda">Ofrenda</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Buscar</label>
                <input
                  type="text"
                  placeholder="Buscar nota o descripción..."
                  value={filterSearch}
                  onChange={e => { setFilterSearch(e.target.value); setCurrentPage(1); }}
                  className="rounded-md border-gray-600 bg-gray-900 text-gray-100 px-3 py-2"
                />
              </div>
              {role === 'admin' && (
                <div className="flex items-center gap-2 mt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showDeleted}
                      onChange={v => { setShowDeleted(v); setCurrentPage(1); }}
                      className={`${showDeleted ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer`}
                    >
                      <span className="sr-only">Ver eliminados</span>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showDeleted ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </Switch>
                    <span className="text-sm text-gray-300 select-none">Ver eliminados</span>
                  </div>
                </div>
              )}
            </div>
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
                    {role === 'admin' && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">Acciones</th>
                    )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-gray-200">{movement.date.toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">{movement.user}</td>
                      {role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                          {!movement.eliminado && (
                            <>
                              <button
                                className="text-indigo-400 hover:text-indigo-600 font-bold cursor-pointer"
                                title="Editar"
                                onClick={() => handleEditMovement(movement)}
                              >
                                <PencilSquareIcon className="h-5 w-5" />
                              </button>
                              <button
                                className="text-red-400 hover:text-red-600 font-bold cursor-pointer"
                                title="Eliminar"
                                onClick={() => handleDeleteRestoreClick(movement, 'delete')}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {movement.eliminado && (
                            <button
                              className="text-green-400 hover:text-green-600 font-bold cursor-pointer"
                              title="Restaurar"
                              onClick={() => handleDeleteRestoreClick(movement, 'restore')}
                            >Restaurar</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-2 sm:mt-4 gap-2">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Filas por página</label>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="rounded-md border-gray-600 bg-gray-900 text-gray-100 px-3 py-2"
                >
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded bg-gray-700 text-gray-200 flex items-center cursor-pointer ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Anterior"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  <span className="sr-only">Anterior</span>
                </button>
                <span className="text-gray-300 text-sm mx-2">Página {currentPage} de {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded bg-gray-700 text-gray-200 flex items-center cursor-pointer ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Siguiente"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                  <span className="sr-only">Siguiente</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-100 mb-4">Nuevo Movimiento</h3>
              <form onSubmit={handleAddMovement}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Tipo</label>
                  <select
                    value={newMovement.type}
                    onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value as 'ingreso' | 'egreso' })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newMovement.amount}
                    onChange={(e) => setNewMovement({ ...newMovement, amount: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Categoría</label>
                  <select
                    value={newMovement.categoria}
                    onChange={(e) => setNewMovement({ ...newMovement, categoria: e.target.value, nota: '' })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  >
                    <option value="Diezmo">Diezmo</option>
                    <option value="Ofrenda">Ofrenda</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                {newMovement.categoria === 'Otro' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-200">Nota</label>
                    <input
                      type="text"
                      value={newMovement.nota}
                      onChange={(e) => setNewMovement({ ...newMovement, nota: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Descripción</label>
                  <textarea
                    required
                    value={newMovement.description}
                    onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-md text-sm font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && editMovement && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-100 mb-4">Editar Movimiento</h3>
              <form onSubmit={handleUpdateMovement}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Tipo</label>
                  <select
                    value={editMovement.type}
                    onChange={(e) => setEditMovement({ ...editMovement, type: e.target.value as 'ingreso' | 'egreso' })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editMovement.amount}
                    onChange={(e) => setEditMovement({ ...editMovement, amount: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Categoría</label>
                  <select
                    value={editMovement.categoria}
                    onChange={(e) => setEditMovement({ ...editMovement, categoria: e.target.value, nota: '' })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  >
                    <option value="Diezmo">Diezmo</option>
                    <option value="Ofrenda">Ofrenda</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                {editMovement.categoria === 'Otro' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-200">Nota</label>
                    <input
                      type="text"
                      value={editMovement.nota}
                      onChange={(e) => setEditMovement({ ...editMovement, nota: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Descripción</label>
                  <textarea
                    required
                    value={editMovement.description}
                    onChange={(e) => setEditMovement({ ...editMovement, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditMovement(null); }}
                    className="bg-gray-600 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-md text-sm font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConfirmModal && movementToDelete && (
          <div className="fixed inset-0 bg-black/75 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-100 mb-4">
                {movementToDelete.action === 'delete' ? '¿Eliminar movimiento?' : '¿Restaurar movimiento?'}
              </h3>
              <p className="text-gray-300 mb-6">
                {movementToDelete.action === 'delete' 
                  ? '¿Estás seguro de que deseas eliminar este movimiento? Esta acción puede revertirse.'
                  : '¿Estás seguro de que deseas restaurar este movimiento?'}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => { setShowConfirmModal(false); setMovementToDelete(null); }}
                  className="bg-gray-600 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-md text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteRestore}
                  className={`${
                    movementToDelete.action === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white px-4 py-2 rounded-md text-sm font-semibold transition`}
                >
                  {movementToDelete.action === 'delete' ? 'Eliminar' : 'Restaurar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tooltip.open && (
          <div
            className="fixed z-50 px-3 py-2 bg-gray-900 text-gray-100 rounded shadow-lg border border-gray-700 text-sm max-w-xs"
            style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
          >
            {tooltip.text}
          </div>
        )}
        
      </div>
    </ProtectedRoute>
  );
} 