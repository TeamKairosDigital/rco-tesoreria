'use client';
import React from 'react';
import { Item, Area, Category } from '@/models/inventory';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

interface ItemListProps {
  items: Item[];
  areas: Area[];
  categories: Category[];
  onEditItem: (item: Item) => void;
  onItemDeleted: () => void;
  onDeleteItem: (item: Item) => void;
}

export default function ItemList({ items, areas, categories, onEditItem, onItemDeleted, onDeleteItem }: ItemListProps) {
  const getAreaName = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : 'Desconocida';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Desconocida';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Elementos del Inventario</h2>
      {items.length === 0 ? (
        <p className="text-gray-400">No hay elementos en el inventario.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
          {items.map(item => (
            <div key={item.id} className="bg-gray-700 p-4 rounded-md shadow-md">
              <h3 className="text-xl font-semibold text-white mb-1">{item.name}</h3>
              <p className="text-gray-400 text-sm">Área: {getAreaName(item.areaId)}</p>
              <p className="text-gray-400 text-sm mb-2">Categoría: {getCategoryName(item.categoryId)}</p>
              <p className="text-gray-300 mb-2">{item.description}</p>
              <p className="text-white font-medium">Cantidad: {item.quantity}</p>
              {item.notes && <p className="text-gray-500 text-sm mt-1">Notas: {item.notes}</p>}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => onEditItem(item)}
                  className="text-blue-400 hover:text-blue-300 p-1 rounded-full hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                  title="Editar"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDeleteItem(item)}
                  className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                  title="Eliminar"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 