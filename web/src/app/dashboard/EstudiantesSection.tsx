'use client'

import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'

interface Estudiante {
  id: string
  codigo_qr: string
  nombre_completo: string
  cedula: string
  nivel: string
  grado: string
  seccion: string
}

export default function EstudiantesSection() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Estudiante | null>(null)
  const [qrVisible, setQrVisible] = useState<{ nombre: string; dataUrl: string } | null>(null)

  const supabase = createClient()

  const cargarEstudiantes = useCallback(async () => {
    setCargando(true)
    const { data } = await supabase
      .from('estudiantes')
      .select('*')
      .order('nombre_completo')
    setEstudiantes(data ?? [])
    setCargando(false)
  }, [supabase])

  useEffect(() => {
    cargarEstudiantes()
  }, [cargarEstudiantes])

  async function guardarEstudiante(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const datos = {
      nombre_completo: form.get('nombre_completo') as string,
      cedula: form.get('cedula') as string,
      nivel: form.get('nivel') as string,
      grado: form.get('grado') as string,
      seccion: form.get('seccion') as string,
    }

    if (editando) {
      await supabase.from('estudiantes').update(datos).eq('id', editando.id)
    } else {
      const codigo_qr = `KUS-${datos.cedula}-${Date.now()}`
      await supabase.from('estudiantes').insert({ ...datos, codigo_qr })
    }

    setModalAbierto(false)
    setEditando(null)
    cargarEstudiantes()
  }

  async function eliminarEstudiante(id: string) {
    if (!confirm('¿Eliminar este estudiante? Esta acción no se puede deshacer.')) return
    await supabase.from('estudiantes').delete().eq('id', id)
    cargarEstudiantes()
  }

  async function mostrarQR(est: Estudiante) {
    const dataUrl = await QRCode.toDataURL(est.codigo_qr, { width: 300 })
    setQrVisible({ nombre: est.nombre_completo, dataUrl })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {estudiantes.length} estudiante{estudiantes.length !== 1 && 's'} registrado{estudiantes.length !== 1 && 's'}
        </p>
        <button
          onClick={() => {
            setEditando(null)
            setModalAbierto(true)
          }}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          + Registrar estudiante
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Cédula</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Grado / Sección</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargando && estudiantes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Aún no hay estudiantes registrados.
                </td>
              </tr>
            )}
            {estudiantes.map((est) => (
              <tr key={est.id}>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {est.nombre_completo}
                </td>
                <td className="px-4 py-3 text-gray-600">{est.cedula}</td>
                <td className="px-4 py-3 text-gray-600">{est.nivel}</td>
                <td className="px-4 py-3 text-gray-600">
                  {est.grado} - {est.seccion}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-xs">
                    <button
                      onClick={() => mostrarQR(est)}
                      className="text-blue-600 hover:underline"
                    >
                      Ver QR
                    </button>
                    <button
                      onClick={() => {
                        setEditando(est)
                        setModalAbierto(true)
                      }}
                      className="text-gray-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarEstudiante(est.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de alta/edición */}
      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              {editando ? 'Editar estudiante' : 'Registrar estudiante'}
            </h3>
            <form onSubmit={guardarEstudiante} className="space-y-3">
              <input
                name="nombre_completo"
                defaultValue={editando?.nombre_completo}
                placeholder="Nombre completo"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="cedula"
                defaultValue={editando?.cedula}
                placeholder="Cédula / DNI"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="nivel"
                defaultValue={editando?.nivel}
                placeholder="Nivel (ej. Primaria)"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-3">
                <input
                  name="grado"
                  defaultValue={editando?.grado}
                  placeholder="Grado"
                  required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  name="seccion"
                  defaultValue={editando?.seccion}
                  placeholder="Sección"
                  required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalAbierto(false)
                    setEditando(null)
                  }}
                  className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal del QR */}
      {qrVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-lg bg-white p-6 text-center">
            <h3 className="mb-4 text-sm font-medium text-gray-800">
              {qrVisible.nombre}
            </h3>
            <img src={qrVisible.dataUrl} alt="Código QR" className="mx-auto" />
            <button
              onClick={() => setQrVisible(null)}
              className="mt-4 w-full rounded bg-gray-700 py-2 text-sm text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}