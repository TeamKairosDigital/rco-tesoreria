import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const deudaRef = doc(db, 'deudas', params.id);
    const deudaDoc = await getDoc(deudaRef);

    if (!deudaDoc.exists()) {
      return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
    }

    const deuda = deudaDoc.data();
    if (deuda.userId !== user.uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const abono = {
      ...data,
      fecha: new Date(data.fecha).toISOString(),
      createdAt: new Date().toISOString()
    };

    const nuevoSaldo = deuda.saldoPendiente - data.cantidad;
    if (nuevoSaldo < 0) {
      return NextResponse.json(
        { error: 'El abono no puede ser mayor al saldo pendiente' },
        { status: 400 }
      );
    }

    await updateDoc(deudaRef, {
      abonos: arrayUnion(abono),
      saldoPendiente: nuevoSaldo
    });

    return NextResponse.json({ ...abono, saldoPendiente: nuevoSaldo });
  } catch (error) {
    console.error('Error al registrar abono:', error);
    return NextResponse.json(
      { error: 'Error al registrar abono' },
      { status: 500 }
    );
  }
} 