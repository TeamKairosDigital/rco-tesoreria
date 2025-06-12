'use client';

import { useState, useEffect, useCallback } from 'react';
import { Area, Category, Item, getAreas, getCategories, getItems, deleteArea, deleteCategory, deleteItem } from '@/models/inventory';
import ItemModal from '@/components/inventario/ItemModal';
import AreaModal from '@/components/inventario/AreaModal';
import CategoryModal from '@/components/inventario/CategoryModal';
import ItemList from '@/components/inventario/ItemList';
import AreaList from '@/components/inventario/AreaList';
import CategoryList from '@/components/inventario/CategoryList';
import ConfirmationModal from '@/components/ConfirmationModal';
import toast from 'react-hot-toast';

export default function InventarioPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedAreaToEdit, setSelectedAreaToEdit] = useState<Area | null>(null);
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<Category | null>(null);

  const [showAreaManagement, setShowAreaManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  // Estado para el modal de confirmación de eliminación de item
  const [isConfirmItemModalOpen, setIsConfirmItemModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const fetchAreas = useCallback(async () => {
    try {
      const data = await getAreas();
      setAreas(data);
    } catch (error) {
      console.error('Error fetching areas:', error);
      toast.error('Error al cargar las áreas');
    }
  }, []);

  const fetchCategories = useCallback(async (areaId?: string) => {
    try {
      const data = await getCategories(areaId);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error al cargar las categorías');
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const data = await getItems(selectedArea, selectedCategory);
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Error al cargar los elementos del inventario');
    }
  }, [selectedArea, selectedCategory]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    fetchCategories(selectedArea);
  }, [selectedArea, fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleItemUpdated = () => {
    fetchItems();
  };

  const handleAreaUpdated = () => {
    fetchAreas();
    fetchCategories(); // Re-fetch categories as they might depend on areas
    fetchItems(); // Re-fetch items as they might depend on areas
  };

  const handleCategoryUpdated = () => {
    fetchCategories(selectedArea);
    fetchItems(); // Re-fetch items as they might depend on categories
  };

  const handleDeleteItemClick = (item: Item) => {
    setItemToDelete(item);
    setIsConfirmItemModalOpen(true);
  };

  const handleConfirmDeleteItem = async () => {
    if (itemToDelete && itemToDelete.id) {
      try {
        await deleteItem(itemToDelete.id);
        toast.success('Elemento eliminado exitosamente');
        fetchItems(); // Actualizar la lista de items
        setIsConfirmItemModalOpen(false);
        setItemToDelete(null);
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Error al eliminar el elemento');
      }
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Gestión de Inventario</h1>

      {/* Botones de acción principal */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => { setSelectedItem(null); setIsItemModalOpen(true); setShowAreaManagement(false); setShowCategoryManagement(false); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
        >
          Añadir Elemento
        </button>
        <button
          onClick={() => { setShowAreaManagement(true); setShowCategoryManagement(false); setSelectedAreaToEdit(null); setIsAreaModalOpen(false); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
        >
          Gestionar Áreas
        </button>
        <button
          onClick={() => { setShowCategoryManagement(true); setShowAreaManagement(false); setSelectedCategoryToEdit(null); setIsCategoryModalOpen(false); }}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
        >
          Gestionar Categorías
        </button>
      </div>

      {/* Sección de Gestión de Áreas */}
      {showAreaManagement && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Gestión de Áreas</h2>
            <button
              onClick={() => { setSelectedAreaToEdit(null); setIsAreaModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
            >
              Añadir Área
            </button>
          </div>
          <AreaList areas={areas} onEdit={(area) => { setSelectedAreaToEdit(area); setIsAreaModalOpen(true); }} onAreaDeleted={handleAreaUpdated} />
          <button
            onClick={() => setShowAreaManagement(false)}
            className="mt-4 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
          >
            Volver al Inventario Principal
          </button>
        </div>
      )}

      {/* Sección de Gestión de Categorías */}
      {showCategoryManagement && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Gestión de Categorías</h2>
            <button
              onClick={() => { setSelectedCategoryToEdit(null); setIsCategoryModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
            >
              Añadir Categoría
            </button>
          </div>
          <CategoryList categories={categories} areas={areas} onEdit={(category) => { setSelectedCategoryToEdit(category); setIsCategoryModalOpen(true); }} onCategoryDeleted={handleCategoryUpdated} />
          <button
            onClick={() => setShowCategoryManagement(false)}
            className="mt-4 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
          >
            Volver al Inventario Principal
          </button>
        </div>
      )}

      {/* Filtros y Lista de Elementos (Solo si no estamos gestionando áreas/categorías) */}
      {!showAreaManagement && !showCategoryManagement && (
        <>
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            <label htmlFor="area-filter" className="text-lg">Filtrar por Área:</label>
            <select
              id="area-filter"
              value={selectedArea || ''}
              onChange={(e) => {
                setSelectedArea(e.target.value || undefined);
                setSelectedCategory(undefined); // Reset category when area changes
              }}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Todas las Áreas</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>

            <label htmlFor="category-filter" className="text-lg">Filtrar por Categoría:</label>
            <select
              id="category-filter"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || undefined)}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              disabled={!selectedArea && categories.length === 0} // Disable if no area selected or no categories
            >
              <option value="">Todas las Categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <ItemList
            items={items}
            areas={areas}
            categories={categories}
            onEditItem={(item: Item) => { setSelectedItem(item); setIsItemModalOpen(true); }}
            onItemDeleted={handleItemUpdated}
            onDeleteItem={handleDeleteItemClick}
          />
        </>
      )}

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={() => { setIsItemModalOpen(false); setSelectedItem(null); handleItemUpdated(); }}
        item={selectedItem}
        areas={areas}
        categories={categories}
      />

      <AreaModal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        onSuccess={() => { setIsAreaModalOpen(false); setSelectedAreaToEdit(null); handleAreaUpdated(); }}
        area={selectedAreaToEdit}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => { setIsCategoryModalOpen(false); setSelectedCategoryToEdit(null); handleCategoryUpdated(); }}
        category={selectedCategoryToEdit}
        areas={areas}
      />

      {/* Confirmation Modal for Item Deletion */}
      <ConfirmationModal
        isOpen={isConfirmItemModalOpen}
        onClose={() => setIsConfirmItemModalOpen(false)}
        onConfirm={handleConfirmDeleteItem}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el elemento "${itemToDelete?.name || ''}"? Esta acción no se puede deshacer.`}
        isLoading={false} // Puedes añadir un estado de carga si la eliminación es asíncrona y quieres un indicador
      />
    </div>
  );
} 