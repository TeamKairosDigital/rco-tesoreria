'use client';
import React, { useState, useEffect } from 'react';
import { Category, Area, createCategory, updateCategory } from '@/models/inventory';
import toast from 'react-hot-toast';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: Category | null;
  areas: Area[];
}

export default function CategoryModal({ isOpen, onClose, onSuccess, category, areas }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setAreaId(category.areaId);
    } else {
      setName('');
      setAreaId(undefined);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }
    if (!areaId) {
      toast.error('Debes seleccionar un área para la categoría');
      return;
    }

    setIsLoading(true);
    try {
      if (category) {
        await updateCategory({ ...category, name, areaId });
      } else {
        await createCategory({ name, areaId });
      }
      toast.success(category ? 'Categoría actualizada' : 'Categoría creada');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la categoría');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">
          {category ? 'Editar Categoría' : 'Añadir Categoría'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Utensilios, Libros, etc."
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-300 mb-1">
              Área
            </label>
            <select
              id="area"
              value={areaId || ''}
              onChange={(e) => setAreaId(e.target.value || undefined)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              disabled={isLoading}
            >
              <option value="">Selecciona un Área</option>
              {areas.map((areaOption) => (
                <option key={areaOption.id} value={areaOption.id}>
                  {areaOption.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 