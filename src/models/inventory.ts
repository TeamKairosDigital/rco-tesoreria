import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

// Interfaces for Inventory Models
export interface Area {
  id?: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id?: string;
  name: string;
  areaId: string; // Foreign key to Area
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Item {
  id?: string;
  name: string;
  description: string;
  areaId: string; // Foreign key to Area
  categoryId: string; // Foreign key to Category
  quantity: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ======================= Area Functions =======================

export async function createArea(area: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>): Promise<Area> {
  const areasCollectionRef = collection(db, 'areas');
  const newAreaRef = await addDoc(areasCollectionRef, {
    ...area,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const newAreaDoc = await getDoc(newAreaRef);
  return { id: newAreaDoc.id, ...(newAreaDoc.data() as Area) };
}

export async function getAreas(): Promise<Area[]> {
  const areasCollectionRef = collection(db, 'areas');
  const q = query(areasCollectionRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Area) }));
}

export async function updateArea(area: Area): Promise<void> {
  if (!area.id) {
    throw new Error('Area ID is required for update.');
  }
  const areaDocRef = doc(db, 'areas', area.id);
  await updateDoc(areaDocRef, { ...area, updatedAt: serverTimestamp() });
}

export async function deleteArea(id: string): Promise<void> {
  const areaDocRef = doc(db, 'areas', id);
  await deleteDoc(areaDocRef);
}

// ======================= Category Functions =======================

export async function createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  const categoriesCollectionRef = collection(db, 'categories');
  const newCategoryRef = await addDoc(categoriesCollectionRef, {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const newCategoryDoc = await getDoc(newCategoryRef);
  return { id: newCategoryDoc.id, ...(newCategoryDoc.data() as Category) };
}

export async function getCategories(areaId?: string): Promise<Category[]> {
  const categoriesCollectionRef = collection(db, 'categories');
  let q = query(categoriesCollectionRef);
  if (areaId) {
    q = query(categoriesCollectionRef, where('areaId', '==', areaId));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Category) }));
}

export async function updateCategory(category: Category): Promise<void> {
  if (!category.id) {
    throw new Error('Category ID is required for update.');
  }
  const categoryDocRef = doc(db, 'categories', category.id);
  await updateDoc(categoryDocRef, { ...category, updatedAt: serverTimestamp() });
}

export async function deleteCategory(id: string): Promise<void> {
  const categoryDocRef = doc(db, 'categories', id);
  await deleteDoc(categoryDocRef);
}

// ======================= Item Functions =======================

export async function createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
  const itemsCollectionRef = collection(db, 'items');
  const newItemRef = await addDoc(itemsCollectionRef, {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const newItemDoc = await getDoc(newItemRef);
  return { id: newItemDoc.id, ...(newItemDoc.data() as Item) };
}

export async function getItems(areaId?: string, categoryId?: string): Promise<Item[]> {
  const itemsCollectionRef = collection(db, 'items');
  let q = query(itemsCollectionRef);
  if (areaId) {
    q = query(itemsCollectionRef, where('areaId', '==', areaId));
  }
  if (categoryId) {
    q = query(itemsCollectionRef, where('categoryId', '==', categoryId));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Item) }));
}

export async function updateItem(item: Item): Promise<void> {
  if (!item.id) {
    throw new Error('Item ID is required for update.');
  }
  const itemDocRef = doc(db, 'items', item.id);
  await updateDoc(itemDocRef, { ...item, updatedAt: serverTimestamp() });
}

export async function deleteItem(id: string): Promise<void> {
  const itemDocRef = doc(db, 'items', id);
  await deleteDoc(itemDocRef);
} 