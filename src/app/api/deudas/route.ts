import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

export async function GET() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deudasRef = collection(db, 'deudas');
    const q = query(deudasRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    const deudas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(deudas);
  } catch (error) {
    console.error('Error al obtener deudas:', error);
    return NextResponse.json({ error: 'Error al obtener deudas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const deudasRef = collection(db, 'deudas');
    
    const newDeuda = {
      ...data,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(deudasRef, newDeuda);
    
    return NextResponse.json({ id: docRef.id, ...newDeuda });
  } catch (error) {
    console.error('Error al crear deuda:', error);
    return NextResponse.json({ error: 'Error al crear deuda' }, { status: 500 });
  }
} 