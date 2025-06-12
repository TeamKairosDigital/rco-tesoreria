import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Deuda {
  nombre: string;
  titular: string;
  descripcion: string;
  cantidad: number;
  saldoPendiente: number;
  abonos: Array<{
    fecha: string;
    cantidad: number;
    observacion?: string;
  }>;
  userId: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deudaRef = doc(db, 'deudas', params.id);
    const deudaDoc = await getDoc(deudaRef);

    if (!deudaDoc.exists()) {
      return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
    }

    const deuda = deudaDoc.data() as Deuda;
    if (deuda.userId !== user.uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const pdfDoc = new jsPDF();
    
    // Título
    pdfDoc.setFontSize(16);
    pdfDoc.text('Detalles de Deuda', 14, 15);
    
    // Información de la deuda
    pdfDoc.setFontSize(12);
    pdfDoc.text(`Nombre: ${deuda.nombre}`, 14, 30);
    pdfDoc.text(`Titular: ${deuda.titular}`, 14, 40);
    pdfDoc.text(`Descripción: ${deuda.descripcion}`, 14, 50);
    pdfDoc.text(`Cantidad Total: $${deuda.cantidad.toFixed(2)}`, 14, 60);
    pdfDoc.text(`Saldo Pendiente: $${deuda.saldoPendiente.toFixed(2)}`, 14, 70);
    
    // Tabla de abonos
    if (deuda.abonos && deuda.abonos.length > 0) {
      const abonosData = deuda.abonos.map(abono => [
        format(new Date(abono.fecha), 'dd/MM/yyyy', { locale: es }),
        `$${abono.cantidad.toFixed(2)}`,
        abono.observacion || '-'
      ]);
      
      autoTable(pdfDoc, {
        startY: 80,
        head: [['Fecha', 'Cantidad', 'Observación']],
        body: abonosData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
    }
    
    const pdfBuffer = pdfDoc.output('arraybuffer');
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="deuda-${deuda.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar PDF' },
      { status: 500 }
    );
  }
} 