'use client';
import React, { useState, useEffect } from 'react';
import { Area, createArea, updateArea } from '@/models/inventory';
import toast from 'react-hot-toast';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  area: Area | null;
}

export default function AreaModal({ isOpen, onClose, onSuccess, area }: AreaModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (area) {
      setName(area.name);
    } else {
      setName('');
    }
  }, [area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del área es requerido');
      return;
    }

    setIsLoading(true);
    try {
      if (area) {
        await updateArea({ ...area, name });
      } else {
        await createArea({ name });
      }
      toast.success(area ? 'Área actualizada' : 'Área creada');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el área');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">
          {area ? 'Editar Área' : 'Añadir Área'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre del Área
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Cocina, Audio, etc."
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : area ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 