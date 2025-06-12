'use client';
import React, { useState } from 'react';
import { Area, deleteArea } from '@/models/inventory';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface AreaListProps {
  areas: Area[];
  onEdit: (area: Area) => void;
  onAreaDeleted: () => void;
}

export default function AreaList({ areas, onEdit, onAreaDeleted }: AreaListProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteClick = (area: Area) => {
    setAreaToDelete(area);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (areaToDelete && areaToDelete.id) {
      setIsLoading(true);
      try {
        await deleteArea(areaToDelete.id);
        toast.success('Área eliminada exitosamente');
        onAreaDeleted();
        setIsConfirmModalOpen(false);
        setAreaToDelete(null);
      } catch (error) {
        console.error('Error deleting area:', error);
        toast.error('Error al eliminar el área');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-white">Listado de Áreas</h3>
      {areas.length === 0 ? (
        <p className="text-gray-400">No hay áreas registradas.</p>
      ) : (
        <ul className="space-y-3">
          {areas.map((area) => (
            <li key={area.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
              <span className="text-white text-lg">{area.name}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(area)}
                  className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Editar Área"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(area)}
                  className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Eliminar Área"
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
        message={`¿Estás seguro de que quieres eliminar el área "${areaToDelete?.name || ''}"? Esta acción no se puede deshacer.`}
        isLoading={isLoading}
      />
    </div>
  );
} 