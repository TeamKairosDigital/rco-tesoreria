'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Deuda } from '@/models/debt';
import { formatCurrency } from '@/lib/utils';

interface DeudaHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deuda: Deuda | null;
}

export default function DeudaHistoryModal({ isOpen, onClose, deuda }: DeudaHistoryModalProps) {
  if (!isOpen || !deuda) return null;

  const totalAbonado = deuda.abonos.reduce((sum, abono) => sum + abono.cantidad, 0);

  return (
    <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-semibold text-white mb-4">Historial de Abonos - {deuda.nombre}</h2>

        <div className="bg-gray-700 p-4 rounded-md mb-6 shadow-inner">
          <h3 className="text-lg font-medium text-white mb-2">Detalles de la Deuda</h3>
          <p className="text-gray-300"><strong>Titular:</strong> {deuda.titular}</p>
          <p className="text-gray-300"><strong>Descripción:</strong> {deuda.descripcion}</p>
          <p className="text-gray-300"><strong>Cantidad Total:</strong> {formatCurrency(deuda.cantidad)}</p>
          <p className="text-gray-300"><strong>Saldo Pendiente:</strong> {formatCurrency(deuda.saldoPendiente)}</p>
          <p className="text-gray-300"><strong>Total Abonado:</strong> {formatCurrency(totalAbonado)}</p>
        </div>

        <h3 className="text-lg font-medium text-white mb-3">Historial de Abonos</h3>
        {deuda.abonos && deuda.abonos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 rounded-md overflow-hidden">
              <thead>
                <tr className="bg-indigo-600 text-white text-left">
                  <th className="py-2 px-4">Fecha</th>
                  <th className="py-2 px-4">Cantidad</th>
                  <th className="py-2 px-4">Observación</th>
                </tr>
              </thead>
              <tbody>
                {deuda.abonos.map((abono, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-600' : 'bg-gray-700'}>
                    <td className="py-2 px-4 text-gray-200">{format(new Date(abono.fecha), 'dd/MM/yyyy', { locale: es })}</td>
                    <td className="py-2 px-4 text-green-400 font-medium">{formatCurrency(abono.cantidad)}</td>
                    <td className="py-2 px-4 text-gray-200">{abono.observacion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No hay abonos registrados para esta deuda.</p>
        )}

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
} 