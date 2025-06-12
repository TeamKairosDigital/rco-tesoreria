import { collection, addDoc, updateDoc, doc, getDocs, getDoc, query, orderBy, Timestamp, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Abono {
  cantidad: number;
  fecha: Date;
  observacion?: string;
  createdAt: Date;
}

export interface Deuda {
  id?: string;
  nombre: string;
  descripcion: string;
  titular: string;
  cantidad: number;
  saldoPendiente: number;
  abonos: Abono[];
  createdAt: Date;
  updatedAt: Date;
}

export const createDeuda = async (deuda: Omit<Deuda, 'id' | 'createdAt' | 'updatedAt'>) => {
  const deudaData = {
    ...deuda,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, 'deudas'), deudaData);
  return { id: docRef.id, ...deudaData };
};

export const updateDeuda = async (deudaId: string, updates: Partial<Omit<Deuda, 'id' | 'createdAt'>>) => {
  const deudaRef = doc(db, 'deudas', deudaId);
  await updateDoc(deudaRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteDeuda = async (deudaId: string) => {
  await deleteDoc(doc(db, 'deudas', deudaId));
};

export const getDeudas = async () => {
  const q = query(collection(db, 'deudas'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    abonos: doc.data().abonos?.map((abono: any) => ({
      ...abono,
      fecha: abono.fecha?.toDate(),
      createdAt: abono.createdAt?.toDate(),
    })) || [],
  })) as Deuda[];
};

export const addAbono = async (deudaId: string, abono: Omit<Abono, 'createdAt'>) => {
  const deudaRef = doc(db, 'deudas', deudaId);
  const deudaDoc = await getDoc(deudaRef);
  
  if (!deudaDoc.exists()) {
    throw new Error('Deuda no encontrada');
  }

  const deuda = deudaDoc.data() as Deuda;

  const abonoData = {
    ...abono,
    createdAt: Timestamp.now(),
  };

  const abonos = [...(deuda.abonos || []), abonoData];
  const saldoPendiente = deuda.cantidad - abonos.reduce((sum, a) => sum + a.cantidad, 0);

  await updateDoc(deudaRef, {
    abonos,
    saldoPendiente,
    updatedAt: Timestamp.now(),
  });

  return { id: deudaId, ...deuda, abonos, saldoPendiente };
}; 