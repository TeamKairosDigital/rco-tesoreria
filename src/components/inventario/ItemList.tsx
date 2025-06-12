'use client';
import React from 'react';
import { Item, Area, Category } from '@/models/inventory';

interface ItemListProps {
  items: Item[];
  areas: Area[];
  categories: Category[];
  onEditItem: (item: Item) => void;
  onItemDeleted: () => void;
}

export default function ItemList({ items, areas, categories, onEditItem, onItemDeleted }: ItemListProps) {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className="bg-gray-700 p-4 rounded-md shadow-md">
              <h3 className="text-xl font-semibold text-white mb-1">{item.name}</h3>
              <p className="text-gray-400 text-sm">Área: {getAreaName(item.areaId)}</p>
              <p className="text-gray-400 text-sm mb-2">Categoría: {getCategoryName(item.categoryId)}</p>
              <p className="text-gray-300 mb-2">{item.description}</p>
              <p className="text-white font-medium">Cantidad: {item.quantity}</p>
              {item.notes && <p className="text-gray-500 text-sm mt-1">Notas: {item.notes}</p>}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => onEditItem(item)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                >
                  Editar
                </button>
                {/* Botón de eliminar, la lógica de eliminación se implementará aquí o se pasará a un modal de confirmación */}
                <button
                  onClick={() => console.log('Eliminar', item.id)} // Placeholder for delete action
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 