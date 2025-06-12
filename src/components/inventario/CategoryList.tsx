'use client';
// src/components/inventario/CategoryList.tsx
import React, { useState } from 'react';
import { Category, Area, deleteCategory } from '@/models/inventory';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CategoryListProps {
  categories: Category[];
  areas: Area[];
  onEdit: (category: Category) => void;
  onCategoryDeleted: () => void;
}

export default function CategoryList({ categories, areas, onEdit, onCategoryDeleted }: CategoryListProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAreaName = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : 'Desconocida';
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete && categoryToDelete.id) {
      setIsLoading(true);
      try {
        await deleteCategory(categoryToDelete.id);
        toast.success('Categoría eliminada exitosamente');
        onCategoryDeleted();
        setIsConfirmModalOpen(false);
        setCategoryToDelete(null);
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Error al eliminar la categoría');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-white">Listado de Categorías</h3>
      {categories.length === 0 ? (
        <p className="text-gray-400">No hay categorías registradas.</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
              <div>
                <span className="text-white text-lg">{category.name}</span>
                <p className="text-gray-400 text-sm">Área: {getAreaName(category.areaId)}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(category)}
                  className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  title="Editar Categoría"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(category)}
                  className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                  title="Eliminar Categoría"
                  disabled={isLoading}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete?.name || ''}"? Esta acción no se puede deshacer.`}
        isLoading={isLoading}
      />
    </div>
  );
} 