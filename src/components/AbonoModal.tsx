'use client';

import { useState } from 'react';
import { addAbono, Deuda } from '@/models/debt';
import toast from 'react-hot-toast';

interface AbonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deuda: Deuda;
}

export default function AbonoModal({ isOpen, onClose, onSuccess, deuda }: AbonoModalProps) {
  const [formData, setFormData] = useState({
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    observacion: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantidad = Number(formData.cantidad);
    
    if (cantidad > deuda.saldoPendiente) {
      toast.error('El abono no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      await addAbono(deuda.id!, {
        cantidad,
        fecha: new Date(formData.fecha),
        observacion: formData.observacion
      });
      toast.success('Abono registrado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Error al registrar el abono');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Registrar Abono</h2>
        <div className="mb-4">
          <p className="text-gray-200">Saldo pendiente: ${deuda.saldoPendiente.toFixed(2)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              max={deuda.saldoPendiente}
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Fecha
            </label>
            <input
              type="date"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Observación
            </label>
            <textarea
              value={formData.observacion}
              onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Registrar Abono
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 