'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Deuda, deleteDeuda } from '@/models/debt';
import { formatCurrency } from '@/lib/utils';
import DeudaModal from './DeudaModal';
import AbonoModal from './AbonoModal';
import DeudaHistoryModal from './DeudaHistoryModal';
import ConfirmationModal from './ConfirmationModal';
import toast from 'react-hot-toast';
import {
  PencilIcon, // para Editar
  CurrencyDollarIcon, // para Abonar
  ListBulletIcon, // para Ver Historial
  DocumentArrowDownIcon, // para Generar PDF
  TrashIcon // para Eliminar
} from '@heroicons/react/24/outline';

interface DeudaListProps {
  deudas: Deuda[];
  onDeudaUpdated: () => void;
}

export default function DeudaList({ deudas, onDeudaUpdated }: DeudaListProps) {
  const [selectedDeuda, setSelectedDeuda] = useState<Deuda | null>(null);
  const [isDeudaModalOpen, setIsDeudaModalOpen] = useState(false);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleEdit = (deuda: Deuda) => {
    setSelectedDeuda(deuda);
    setIsDeudaModalOpen(true);
  };

  const handleAbono = (deuda: Deuda) => {
    setSelectedDeuda(deuda);
    setIsAbonoModalOpen(true);
  };

  const handleViewHistory = (deuda: Deuda) => {
    setSelectedDeuda(deuda);
    setIsHistoryModalOpen(true);
  };

  const handleDeleteClick = (deuda: Deuda) => {
    setSelectedDeuda(deuda);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedDeuda && selectedDeuda.id) {
      try {
        await deleteDeuda(selectedDeuda.id);
        toast.success('Deuda eliminada exitosamente');
        onDeudaUpdated();
      } catch (error) {
        console.error('Error al eliminar la deuda:', error);
        toast.error('Error al eliminar la deuda');
      } finally {
        setIsConfirmModalOpen(false);
        setSelectedDeuda(null);
      }
    }
  };

  const generatePDF = (deuda: Deuda) => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.text('Detalles de Deuda', 14, 15);
    
    // Información de la deuda
    doc.setFontSize(12);
    doc.text(`Nombre: ${deuda.nombre}`, 14, 30);
    doc.text(`Titular: ${deuda.titular}`, 14, 40);
    doc.text(`Descripción: ${deuda.descripcion}`, 14, 50);
    doc.text(`Cantidad Total: ${formatCurrency(deuda.cantidad)}`, 14, 60);
    doc.text(`Saldo Pendiente: ${formatCurrency(deuda.saldoPendiente)}`, 14, 70);
    
    // Tabla de abonos
    const abonosData = deuda.abonos.map(abono => [
      format(new Date(abono.fecha), 'dd/MM/yyyy', { locale: es }),
      formatCurrency(abono.cantidad),
      abono.observacion || '-'
    ]);
    
    autoTable(doc, {
      startY: 80,
      head: [['Fecha', 'Cantidad', 'Observación']],
      body: abonosData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save(`deuda-${deuda.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const generateGeneralPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.text('Reporte General de Deudas', 14, 15);
    
    // Tabla de deudas
    const deudasData = deudas.map(deuda => [
      deuda.nombre,
      deuda.titular,
      formatCurrency(deuda.cantidad),
      formatCurrency(deuda.saldoPendiente),
      `${((deuda.cantidad - deuda.saldoPendiente) / deuda.cantidad * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      startY: 25,
      head: [['Nombre', 'Titular', 'Total', 'Pendiente', 'Pagado']],
      body: deudasData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Totales
    const totalDeuda = deudas.reduce((sum, deuda) => sum + deuda.cantidad, 0);
    const totalPendiente = deudas.reduce((sum, deuda) => sum + deuda.saldoPendiente, 0);
    const totalPagado = totalDeuda - totalPendiente;
    
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Total Deuda: ${formatCurrency(totalDeuda)}`, 14, finalY + 10);
    doc.text(`Total Pendiente: ${formatCurrency(totalPendiente)}`, 14, finalY + 20);
    doc.text(`Total Pagado: ${formatCurrency(totalPagado)}`, 14, finalY + 30);
    
    doc.save('reporte-general-deudas.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="block md:flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Deudas</h2>
        <div className="space-x-2">
          <button
            onClick={() => {
              setSelectedDeuda(null);
              setIsDeudaModalOpen(true);
            }}
            className="px-4 py-2 my-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            Nueva Deuda
          </button>
          <button
            onClick={generateGeneralPDF}
            className="px-4 py-2 my-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 cursor-pointer"
          >
            Generar PDF General
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deudas.map((deuda) => (
          <div
            key={deuda.id}
            className="bg-gray-800 rounded-lg p-4 shadow-lg relative"
          >
            <button
              onClick={() => handleDeleteClick(deuda)}
              className="absolute top-2 right-2 text-red-400 hover:text-red-300 focus:outline-none cursor-pointer"
              title="Eliminar Deuda"
            >
              <TrashIcon className="h-5 w-5" />
            </button>

            <div className="flex justify-between items-start mb-4">
              <div className="mr-auto">
                <h3 className="text-lg font-semibold text-white">{deuda.nombre}</h3>
                <p className="text-gray-400">{deuda.titular}</p>
              </div>
              <div className="text-right mr-12">
                <p className="text-white font-medium">{formatCurrency(deuda.cantidad)}</p>
                <p className="text-gray-400">Saldo: {formatCurrency(deuda.saldoPendiente)}</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4">{deuda.descripcion}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => handleEdit(deuda)}
                className="flex flex-col items-center justify-center p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                title="Editar Deuda"
              >
                <PencilIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Editar</span>
              </button>
              <button
                onClick={() => handleAbono(deuda)}
                className="flex flex-col items-center justify-center p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                title="Abonar"
              >
                <CurrencyDollarIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Abonar</span>
              </button>
              <button
                onClick={() => handleViewHistory(deuda)}
                className="flex flex-col items-center justify-center p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 col-span-1 cursor-pointer"
                title="Ver Historial"
              >
                <ListBulletIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">Historial</span>
              </button>
              <button
                onClick={() => generatePDF(deuda)}
                className="flex flex-col items-center justify-center p-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 col-span-1 cursor-pointer"
                title="Generar PDF"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <DeudaModal
        isOpen={isDeudaModalOpen}
        onClose={() => {
          setIsDeudaModalOpen(false);
          setSelectedDeuda(null);
        }}
        onSuccess={() => {
          setIsDeudaModalOpen(false);
          setSelectedDeuda(null);
          onDeudaUpdated();
        }}
        deuda={selectedDeuda}
      />

      {selectedDeuda && (
        <AbonoModal
          isOpen={isAbonoModalOpen}
          onClose={() => {
            setIsAbonoModalOpen(false);
            setSelectedDeuda(null);
          }}
          onSuccess={() => {
            setIsAbonoModalOpen(false);
            setSelectedDeuda(null);
            onDeudaUpdated();
          }}
          deuda={selectedDeuda}
        />
      )}

      <DeudaHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedDeuda(null);
        }}
        deuda={selectedDeuda}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedDeuda(null);
        } }
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar la deuda "${selectedDeuda?.nombre || ''}"? Esta acción no se puede deshacer.`} isLoading={false}      />
    </div>
  );
} 