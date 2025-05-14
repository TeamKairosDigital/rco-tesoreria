'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MovementFilters from '@/components/MovementFilters';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, Timestamp, doc, updateDoc, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { Switch } from '@headlessui/react';
import { ChevronUpIcon, ChevronDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';

interface Movement {
  id: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  description: string;
  date: Date;
  user: string;
  eliminado: boolean;
  categoria?: string;
  nota?: string;
}

// Icono de flecha para ordenamiento
const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => (
  direction === 'asc' ? (
    <ChevronUpIcon className={`inline h-4 w-4 ml-1 ${active ? 'text-indigo-400' : 'text-gray-400'}`} />
  ) : (
    <ChevronDownIcon className={`inline h-4 w-4 ml-1 ${active ? 'text-indigo-400' : 'text-gray-400'}`} />
  )
);

export default function Dashboard() {
  const { user, logout, role } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newMovement, setNewMovement] = useState({
    type: 'ingreso',
    amount: '',
    categoria: 'Diezmo',
    nota: '',
    description: '',
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [pageSnapshots, setPageSnapshots] = useState<any[]>([]); // Para retroceder páginas
  const [loadingPage, setLoadingPage] = useState(false);

  // Estado para mostrar/ocultar eliminados (solo admin)
  const [showDeleted, setShowDeleted] = useState(false);

  const [editModal, setEditModal] = useState<{ open: boolean; movement: Movement | null }>({ open: false, movement: null });

  // Estado para ordenamiento
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
  const [tooltip, setTooltip] = useState<{ open: boolean; text: string; x: number; y: number }>({ open: false, text: '', x: 0, y: 0 });

  // Estados para filtros avanzados
  const [filterCategoria, setFilterCategoria] = useState<string>('Todas');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const [loadingGeneral, setLoadingGeneral] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'movements'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date ? doc.data().date.toDate() : new Date(),
        eliminado: doc.data().eliminado || false,
      })) as Movement[];
      setMovements(movementsData);
      setFilteredMovements(movementsData);
    });
    return () => unsubscribe();
  }, []);

  const handleFilterChange = (startDate: Date | null, endDate: Date | null, categoria: string, search: string) => {
    setFilterCategoria(categoria);
    setFilterSearch(search);
    let filtered = movements;
    if (startDate) {
      filtered = filtered.filter(movement => movement.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(movement => movement.date <= endDate);
    }
    if (categoria && categoria !== 'Todas') {
      filtered = filtered.filter(movement => movement.categoria === categoria);
    }
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(movement =>
        (movement.nota && movement.nota.toLowerCase().includes(searchLower)) ||
        (movement.description && movement.description.toLowerCase().includes(searchLower))
      );
    }
    setFilteredMovements(filtered);
    setCurrentPage(1);
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGeneral(true);
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
    } finally {
      setLoadingGeneral(false);
    }
  };

  // Filtrar movimientos según el rol y el switch
  const visibleMovements = role === 'admin'
    ? (showDeleted ? filteredMovements : filteredMovements.filter(m => !m.eliminado))
    : filteredMovements.filter(m => !m.eliminado);

  // Eliminar (borrado lógico)
  const handleDelete = async (id: string) => {
    setLoadingGeneral(true);
    try {
      await updateDoc(doc(db, 'movements', id), { eliminado: true });
      toast.success('Movimiento eliminado (borrado lógico)');
    } catch (error) {
      toast.error('Error al eliminar');
      console.error(error);
    } finally {
      setLoadingGeneral(false);
    }
  };

  // Restaurar movimiento
  const handleRestore = async (id: string) => {
    setLoadingGeneral(true);
    try {
      await updateDoc(doc(db, 'movements', id), { eliminado: false });
      toast.success('Movimiento restaurado');
    } catch (error) {
      toast.error('Error al restaurar');
      console.error(error);
    } finally {
      setLoadingGeneral(false);
    }
  };

  // Función para actualizar movimiento
  const handleEditMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.movement) return;
    setLoadingGeneral(true);
    try {
      await updateDoc(doc(db, 'movements', editModal.movement.id), {
        type: editModal.movement.type,
        amount: Number(editModal.movement.amount),
        categoria: editModal.movement.categoria,
        nota: editModal.movement.categoria === 'Otro' ? editModal.movement.nota : '',
        description: editModal.movement.description,
      });
      setEditModal({ open: false, movement: null });
      toast.success('Movimiento actualizado exitosamente');
    } catch (error) {
      toast.error('Error al actualizar el movimiento');
      console.error(error);
    } finally {
      setLoadingGeneral(false);
    }
  };

  const totalIngresos = visibleMovements
    .filter(m => m.type === 'ingreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalEgresos = visibleMovements
    .filter(m => m.type === 'egreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const saldo = totalIngresos - totalEgresos;

  // Calcular movimientos a mostrar
  const totalPages = Math.ceil(visibleMovements.length / rowsPerPage);
  const paginatedMovements = visibleMovements.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Ordenar movimientos
  const sortedMovements = [...paginatedMovements].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key as keyof Movement] || '';
    const bValue = b[sortConfig.key as keyof Movement] || '';
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return sortConfig.direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => {
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

  // Nueva función para cargar una página específica
  const fetchPage = async (page: number, direction: 'next' | 'prev' | 'init' = 'init') => {
    setLoadingPage(true);
    let q;
    if (direction === 'next' && lastVisible) {
      q = query(collection(db, 'movements'), orderBy('date', 'desc'), startAfter(lastVisible), limit(rowsPerPage));
    } else if (direction === 'prev' && pageSnapshots[page - 2]) {
      q = query(collection(db, 'movements'), orderBy('date', 'desc'), startAfter(pageSnapshots[page - 2]), limit(rowsPerPage));
    } else {
      q = query(collection(db, 'movements'), orderBy('date', 'desc'), limit(rowsPerPage));
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date ? doc.data().date.toDate() : new Date(),
      eliminado: doc.data().eliminado || false,
    })) as Movement[];
    setMovements(docs);
    setFilteredMovements(docs);
    setFirstVisible(snapshot.docs[0]);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    if (direction === 'next') {
      setPageSnapshots(prev => [...prev, snapshot.docs[0]]);
    } else if (direction === 'prev') {
      setPageSnapshots(prev => prev.slice(0, -1));
    } else if (direction === 'init') {
      setPageSnapshots([snapshot.docs[0]]);
    }
    setLoadingPage(false);
  };

  // useEffect para cargar la primera página al montar
  useEffect(() => {
    fetchPage(1, 'init');
    // eslint-disable-next-line
  }, [rowsPerPage]);

  // Cambiar página
  const goToPage = (page: number) => {
    setLoadingGeneral(true);
    setTimeout(() => {
      setCurrentPage(page);
      setLoadingGeneral(false);
    }, 400);
  };

  // Cambiar cantidad de filas
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoadingGeneral(true);
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
    setTimeout(() => setLoadingGeneral(false), 400);
  };

  // Agrupar por fecha (día) para gráficas
  const dataByDate: Record<string, { ingresos: number; egresos: number; saldo: number }> = {};
  let saldoAcumulado = 0;
  visibleMovements.filter(m => !m.eliminado).forEach((m) => {
    const fecha = format(m.date, "dd/MM/yyyy");
    if (!dataByDate[fecha]) dataByDate[fecha] = { ingresos: 0, egresos: 0, saldo: 0 };
    if (m.type === "ingreso") {
      dataByDate[fecha].ingresos += m.amount;
      saldoAcumulado += m.amount;
    } else {
      dataByDate[fecha].egresos += m.amount;
      saldoAcumulado -= m.amount;
    }
    dataByDate[fecha].saldo = saldoAcumulado;
  });
  const chartData = Object.entries(dataByDate).map(([fecha, valores]) => ({ fecha, ...valores }));

  return (
    <ProtectedRoute>
      <div className="bg-gray-900 w-full p-2">
        {loadingGeneral && <Spinner />}
        <main className="w-full mx-auto py-6 px-2 lg:px-8">
          <div className="px-0 sm:px-0">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 sm:p-4">
                <h2 className="text-base sm:text-lg font-bold text-gray-100 mb-2">Ingresos y Egresos (Barras)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="fecha" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip contentStyle={{ background: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
                    <Legend />
                    <Bar dataKey="ingresos" fill="#34d399" name="Ingresos" />
                    <Bar dataKey="egresos" fill="#f87171" name="Egresos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 sm:p-4">
                <h2 className="text-base sm:text-lg font-bold text-gray-100 mb-2">Saldo Acumulado (Línea)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="fecha" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip contentStyle={{ background: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
                    <Legend />
                    <Line type="monotone" dataKey="saldo" stroke="#6366f1" name="Saldo" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 max-w-md w-full">
              <h3 className="text-base sm:text-lg font-bold text-gray-100 mb-4">Nuevo Movimiento</h3>
              <form onSubmit={handleAddMovement} className="space-y-3 sm:space-y-4">
                <div>
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
                <div>
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
                <div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-200">Nota</label>
                    <input
                      type="text"
                      value={newMovement.nota}
                      onChange={(e) => setNewMovement({ ...newMovement, nota: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-200">Descripción</label>
                  <input
                    type="text"
                    required
                    value={newMovement.description}
                    onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
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

        {editModal.open && editModal.movement && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-100 mb-4">Editar Movimiento</h3>
              <form onSubmit={handleEditMovement}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Tipo</label>
                  <select
                    value={editModal.movement.type}
                    onChange={e => setEditModal({ ...editModal, movement: { ...editModal.movement!, type: e.target.value as 'ingreso' | 'egreso' } })}
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
                    value={editModal.movement.amount}
                    onChange={e => setEditModal({ ...editModal, movement: { ...editModal.movement!, amount: Number(e.target.value) } })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Categoría</label>
                  <select
                    value={editModal.movement.categoria}
                    onChange={e => setEditModal({ ...editModal, movement: { ...editModal.movement!, categoria: e.target.value, nota: '' } })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  >
                    <option value="Diezmo">Diezmo</option>
                    <option value="Ofrenda">Ofrenda</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                {editModal.movement.categoria === 'Otro' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-200">Nota</label>
                    <input
                      type="text"
                      value={editModal.movement.nota}
                      onChange={e => setEditModal({ ...editModal, movement: { ...editModal.movement!, nota: e.target.value } })}
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-200">Descripción</label>
                  <input
                    type="text"
                    required
                    value={editModal.movement.description}
                    onChange={e => setEditModal({ ...editModal, movement: { ...editModal.movement!, description: e.target.value } })}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setEditModal({ open: false, movement: null })}
                    className="bg-gray-600 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-md text-sm font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tooltip para texto largo */}
        {tooltip.open && (
          <div
            className="fixed z-50 px-3 py-2 rounded bg-gray-900 text-gray-100 border border-gray-700 shadow-lg text-xs max-w-xs"
            style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
            onMouseLeave={closeTooltip}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 