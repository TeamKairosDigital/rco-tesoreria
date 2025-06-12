'use client';

import { useEffect, useState } from 'react';
import { createDeuda, updateDeuda, Deuda } from '@/models/debt';
import toast from 'react-hot-toast';

interface DeudaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deuda: Deuda | null; // Ahora puede ser null o Deuda
}

export default function DeudaModal({ isOpen, onClose, onSuccess, deuda }: DeudaModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    titular: '',
    cantidad: ''
  });

  useEffect(() => {
    if (deuda) {
      setFormData({
        nombre: deuda.nombre,
        descripcion: deuda.descripcion,
        titular: deuda.titular,
        cantidad: String(deuda.cantidad) // Convertir a string para el input
      });
    } else {
      // Limpiar el formulario si no hay deuda (para crear una nueva)
      setFormData({
        nombre: '',
        descripcion: '',
        titular: '',
        cantidad: ''
      });
    }
  }, [deuda, isOpen]); // Dependencias para resetear/precargar cuando cambie la deuda o el estado del modal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const commonData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        titular: formData.titular,
        cantidad: Number(formData.cantidad)
      };

      if (deuda && deuda.id) {
        // Actualizar deuda existente
        await updateDeuda(deuda.id, commonData);
        toast.success('Deuda actualizada exitosamente');
      } else {
        // Crear nueva deuda
        await createDeuda({
          ...commonData,
          saldoPendiente: Number(formData.cantidad),
          abonos: []
        });
        toast.success('Deuda creada exitosamente');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar la deuda:', error);
      toast.error('Error al guardar la deuda');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">{deuda ? 'Editar Deuda' : 'Nueva Deuda'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Nombre
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Titular
            </label>
            <input
              type="text"
              required
              value={formData.titular}
              onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              {deuda ? 'Actualizar Deuda' : 'Crear Deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 