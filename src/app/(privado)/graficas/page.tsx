"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface Movement {
  id: string;
  type: "ingreso" | "egreso";
  amount: number;
  date: Date;
  eliminado: boolean;
}

export default function GraficasPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const q = query(collection(db, "movements"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date ? doc.data().date.toDate() : new Date(),
        eliminado: doc.data().eliminado || false,
      })) as Movement[];
      setMovements(data);
    });
    return () => unsubscribe();
  }, []);

  // Filtrar por fechas
  const filtered = movements.filter((m) => {
    if (m.eliminado) return false;
    const d = m.date;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });

  // Agrupar por fecha (día)
  const dataByDate: Record<string, { ingresos: number; egresos: number; saldo: number }> = {};
  let saldoAcumulado = 0;
  filtered.forEach((m) => {
    const fecha = format(m.date, "dd/MM/yyyy");
    if (!dataByDate[fecha]) dataByDate[fecha] = { ingresos: 0, egresos: 0, saldo: 0 };
    if (m.type === "ingreso") {
      dataByDate[fecha].ingresos += m.amount;
      saldoAcumulado += m.amount;
    } else {
      dataByDate[fecha].egresos += m.amount;
      saldoAcumulado -= m.amount;
    }
    dataByDate[fecha].saldo = saldoAcumulado;
  });
  const chartData = Object.entries(dataByDate).map(([fecha, valores]) => ({ fecha, ...valores }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Gráficas de Ingresos, Egresos y Saldo</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-200">Fecha Inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200">Fecha Fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-bold text-gray-100 mb-2">Ingresos y Egresos (Barras)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="fecha" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip contentStyle={{ background: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
              <Legend />
              <Bar dataKey="ingresos" fill="#34d399" name="Ingresos" />
              <Bar dataKey="egresos" fill="#f87171" name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-bold text-gray-100 mb-2">Saldo Acumulado (Línea)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="fecha" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip contentStyle={{ background: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
              <Legend />
              <Line type="monotone" dataKey="saldo" stroke="#6366f1" name="Saldo" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 