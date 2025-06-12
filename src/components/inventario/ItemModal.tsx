'use client';
import React, { useState, useEffect } from 'react';
import { Item, Area, Category, createItem, updateItem } from '@/models/inventory';
import toast from 'react-hot-toast';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: Item | null;
  areas: Area[];
  categories: Category[];
}

export default function ItemModal({ isOpen, onClose, onSuccess, item, areas, categories }: ItemModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [areaId, setAreaId] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description);
      setAreaId(item.areaId);
      setCategoryId(item.categoryId);
      setQuantity(item.quantity);
      setNotes(item.notes || '');
    } else {
      setName('');
      setDescription('');
      setAreaId(undefined);
      setCategoryId(undefined);
      setQuantity(0);
      setNotes('');
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !areaId || !categoryId || quantity <= 0) {
      toast.error('Por favor, rellena todos los campos obligatorios y asegúrate que la cantidad sea mayor a 0');
      return;
    }

    setIsLoading(true);
    try {
      const itemData = {
        name,
        description,
        areaId,
        categoryId,
        quantity,
        notes: notes || '',
      };

      if (item) {
        await updateItem({ ...item, ...itemData });
      } else {
        await createItem(itemData);
      }
      toast.success(item ? 'Elemento actualizado' : 'Elemento creado');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el elemento');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => cat.areaId === areaId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-white">
          {item ? 'Editar Elemento' : 'Añadir Elemento'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre del Elemento
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Computador, Teclado, etc."
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Descripción detallada del elemento..."
              disabled={isLoading}
            ></textarea>
          </div>

          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-300 mb-1">
              Área
            </label>
            <select
              id="area"
              value={areaId || ''}
              onChange={(e) => {
                setAreaId(e.target.value || undefined);
                setCategoryId(undefined); // Reset category when area changes
              }}
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

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Categoría
            </label>
            <select
              id="category"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || undefined)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              disabled={isLoading || !areaId}
            >
              <option value="">Selecciona una Categoría</option>
              {filteredCategories.map((categoryOption) => (
                <option key={categoryOption.id} value={categoryOption.id}>
                  {categoryOption.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
              Notas (Opcional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Cualquier nota adicional..."
              disabled={isLoading}
            ></textarea>
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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : item ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 