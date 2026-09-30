'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface ResumenDia {
  fecha: string
  totalEstudiantes: number
  presentes: number
  porcentajeAsistencia: number
  porcentajeInasistencia: number
}

export default function ResumenEstudiantesSection() {
  const [resumen, setResumen] = useState<ResumenDia[]>([])
  const [cargando, setCargando] = useState(true)
  const supabase = createClient()

  const cargarResumen = useCallback(async () => {
    setCargando(true)

    const { count: totalEstudiantes } = await supabase
      .from('estudiantes')
      .select('*', { count: 'exact', head: true })

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('estudiante_id, created_at')
      .eq('tipo', 'entrada')
      .order('created_at', { ascending: false })

    const total = totalEstudiantes ?? 0
    const porFecha = new Map<string, Set<string>>()

    asistencias?.forEach((a) => {
      const fecha = new Date(a.created_at).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      if (!porFecha.has(fecha)) porFecha.set(fecha, new Set())
      porFecha.get(fecha)!.add(a.estudiante_id)
    })

    const filas: ResumenDia[] = Array.from(porFecha.entries())
      .map(([fecha, presentesSet]) => {
        const presentes = presentesSet.size
        const porcentaje = total > 0 ? (presentes / total) * 100 : 0
        return {
          fecha,
          totalEstudiantes: total,
          presentes,
          porcentajeAsistencia: Math.round(porcentaje * 100) / 100,
          porcentajeInasistencia: Math.round((100 - porcentaje) * 100) / 100,
        }
      })
      .slice(0, 10)

    setResumen(filas)
    setCargando(false)
  }, [supabase])

  useEffect(() => {
    cargarResumen()
  }, [cargarResumen])

  return (
    <div className="space-y-6">
      {/* Tabla resumen */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estudiantes presentes</th>
              <th className="px-4 py-3">% Asistencia</th>
              <th className="px-4 py-3">% Inasistencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargando && resumen.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Aún no hay registros de asistencia.
                </td>
              </tr>
            )}
            {resumen.map((fila) => (
              <tr key={fila.fecha}>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {fila.fecha}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {fila.presentes} / {fila.totalEstudiantes}
                </td>
                <td className="px-4 py-3 font-medium text-green-600">
                  {fila.porcentajeAsistencia}%
                </td>
                <td
                  className={`px-4 py-3 font-medium ${
                    fila.porcentajeInasistencia > 20
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}
                >
                  {fila.porcentajeInasistencia}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráfico */}
      {resumen.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            Porcentaje de Asistencia
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...resumen].reverse()}>
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Bar dataKey="porcentajeAsistencia" fill="#526A91" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}