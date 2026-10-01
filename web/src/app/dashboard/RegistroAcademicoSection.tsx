'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Grado {
  id: string
  nombre: string
  nivel: string
}

interface Seccion {
  id: string
  grado_id: string
  nombre: string
}

export default function RegistroAcademicoSection() {
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalGradoAbierto, setModalGradoAbierto] = useState(false)
  const [gradoParaSeccion, setGradoParaSeccion] = useState<Grado | null>(null)

  const supabase = createClient()

  const cargarTodo = useCallback(async () => {
    setCargando(true)
    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from('grados').select('*').order('nombre'),
      supabase.from('secciones').select('*').order('nombre'),
    ])
    setGrados(g ?? [])
    setSecciones(s ?? [])
    setCargando(false)
  }, [supabase])

  useEffect(() => {
    cargarTodo()
  }, [cargarTodo])

  async function crearGrado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await supabase.from('grados').insert({
      nombre: form.get('nombre') as string,
      nivel: form.get('nivel') as string,
    })
    setModalGradoAbierto(false)
    cargarTodo()
  }

  async function eliminarGrado(id: string) {
    if (
      !confirm(
        '¿Eliminar este grado? También se eliminarán todas sus secciones.'
      )
    )
      return
    await supabase.from('grados').delete().eq('id', id)
    cargarTodo()
  }

  async function crearSeccion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!gradoParaSeccion) return
    const form = new FormData(e.currentTarget)
    await supabase.from('secciones').insert({
      grado_id: gradoParaSeccion.id,
      nombre: form.get('nombre') as string,
    })
    setGradoParaSeccion(null)
    cargarTodo()
  }

  async function eliminarSeccion(id: string) {
    if (!confirm('¿Eliminar esta sección?')) return
    await supabase.from('secciones').delete().eq('id', id)
    cargarTodo()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {grados.length} grado{grados.length !== 1 && 's'} registrado
          {grados.length !== 1 && 's'}
        </p>
        <button
          onClick={() => setModalGradoAbierto(true)}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          + Agregar grado
        </button>
      </div>

      {cargando && (
        <p className="text-center text-sm text-gray-400">Cargando...</p>
      )}

      {!cargando && grados.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          Aún no hay grados registrados.
        </div>
      )}

      <div className="space-y-4">
        {grados.map((grado) => {
          const seccionesDelGrado = secciones.filter(
            (s) => s.grado_id === grado.id
          )
          return (
            <div
              key={grado.id}
              className="rounded-lg border border-gray-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <span className="font-medium text-gray-800">
                    {grado.nombre}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {grado.nivel}
                  </span>
                </div>
                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => setGradoParaSeccion(grado)}
                    className="text-blue-600 hover:underline"
                  >
                    + Sección
                  </button>
                  <button
                    onClick={() => eliminarGrado(grado.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar grado
                  </button>
                </div>
              </div>

              <div className="px-4 py-3">
                {seccionesDelGrado.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    Sin secciones todavía.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {seccionesDelGrado.map((s) => (
                      <span
                        key={s.id}
                        className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                      >
                        Sección {s.nombre}
                        <button
                          onClick={() => eliminarSeccion(s.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: crear grado */}
      {modalGradoAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Agregar grado
            </h3>
            <form onSubmit={crearGrado} className="space-y-3">
              <input
                name="nombre"
                placeholder="Nombre del grado (ej. 4to)"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="nivel"
                placeholder="Nivel (ej. Primaria)"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalGradoAbierto(false)}
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

      {/* Modal: crear sección */}
      {gradoParaSeccion && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Agregar sección a {gradoParaSeccion.nombre}
            </h3>
            <form onSubmit={crearSeccion} className="space-y-3">
              <input
                name="nombre"
                placeholder="Nombre de la sección (ej. A)"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradoParaSeccion(null)}
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
    </div>
  )
}