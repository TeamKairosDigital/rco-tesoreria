'use client';

import { useEffect, useState } from 'react';
import { getDeudas, Deuda } from '@/models/debt';
import DeudaList from '@/components/DeudaList';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

export default function DeudasPage() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeudas = async () => {
    setLoading(true);
    try {
      const data = await getDeudas();
      setDeudas(data);
    } catch (error) {
      toast.error('Error al cargar las deudas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeudas();
  }, []);

  const totalDeudas = deudas.reduce((sum, deuda) => sum + deuda.cantidad, 0);
  const totalPendiente = deudas.reduce((sum, deuda) => sum + deuda.saldoPendiente, 0);
  const totalPagado = totalDeudas - totalPendiente;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Gestión de Deudas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg text-center">
          <p className="text-gray-400 text-sm">Total Deudas</p>
          <p className="text-white text-2xl font-bold">{formatCurrency(totalDeudas)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg text-center">
          <p className="text-gray-400 text-sm">Total Pendiente</p>
          <p className="text-red-500 text-2xl font-bold">{formatCurrency(totalPendiente)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg text-center">
          <p className="text-gray-400 text-sm">Total Abonado</p>
          <p className="text-green-500 text-2xl font-bold">{formatCurrency(totalPagado)}</p>
        </div>
      </div>

      <DeudaList deudas={deudas} onDeudaUpdated={loadDeudas} />
    </div>
  );
} 