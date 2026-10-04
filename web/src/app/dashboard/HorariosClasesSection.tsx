'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ComboboxEstilo from './ComboboxEstilo'

interface Area {
  id: string
  nombre: string
}
interface Grado {
  id: string
  nombre: string
}
interface Seccion {
  id: string
  grado_id: string
  nombre: string
}
interface Docente {
  id: string
  nombre_completo: string
}
interface Clase {
  id: string
  area_id: string
  grado_id: string
  seccion_id: string
  docente_id: string | null
  dia: string
  hora_inicio: string
  hora_fin: string
}

const dias = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
]

export default function HorariosClasesSection() {
  const [areas, setAreas] = useState<Area[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [clases, setClases] = useState<Clase[]>([])
  const [cargando, setCargando] = useState(true)

  const [modalAreaAbierto, setModalAreaAbierto] = useState(false)
  const [modalClaseAbierto, setModalClaseAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [areaId, setAreaId] = useState('')
  const [gradoId, setGradoId] = useState('')
  const [seccionId, setSeccionId] = useState('')
  const [docenteId, setDocenteId] = useState('')

  const supabase = createClient()

  const cargarTodo = useCallback(async () => {
    setCargando(true)
    const [
      { data: a },
      { data: g },
      { data: s },
      { data: d },
      { data: c },
    ] = await Promise.all([
      supabase.from('areas').select('*').order('nombre'),
      supabase.from('grados').select('*').order('nombre'),
      supabase.from('secciones').select('*').order('nombre'),
      supabase
        .from('profiles')
        .select('id, nombre_completo')
        .eq('role', 'docente')
        .order('nombre_completo'),
      supabase.from('clases').select('*'),
    ])
    setAreas(a ?? [])
    setGrados(g ?? [])
    setSecciones(s ?? [])
    setDocentes(d ?? [])
    setClases(c ?? [])
    setCargando(false)
  }, [supabase])

  useEffect(() => {
    cargarTodo()
  }, [cargarTodo])

  async function crearArea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await supabase.from('areas').insert({ nombre: form.get('nombre') as string })
    setModalAreaAbierto(false)
    cargarTodo()
  }

  async function eliminarArea(id: string) {
    if (!confirm('¿Eliminar esta área y todas sus clases asociadas?')) return
    await supabase.from('areas').delete().eq('id', id)
    cargarTodo()
  }

  function abrirModalClase(area: Area) {
    setAreaId(area.id)
    setGradoId('')
    setSeccionId('')
    setDocenteId('')
    setModalClaseAbierto(true)
  }

  async function crearClase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGuardando(true)
    const form = new FormData(e.currentTarget)

    const { error } = await supabase.from('clases').insert({
      area_id: areaId,
      grado_id: gradoId,
      seccion_id: seccionId,
      docente_id: docenteId || null,
      dia: form.get('dia') as string,
      hora_inicio: form.get('hora_inicio') as string,
      hora_fin: form.get('hora_fin') as string,
      minutos_apertura_anticipada: Number(form.get('minutos')),
    })

    setGuardando(false)

    if (error) {
      alert(`No se pudo guardar: ${error.message}`)
      return
    }

    setModalClaseAbierto(false)
    cargarTodo()
  }

  async function eliminarClase(id: string) {
    if (!confirm('¿Eliminar este horario de clase?')) return
    await supabase.from('clases').delete().eq('id', id)
    cargarTodo()
  }

  const nombreGrado = (id: string) => grados.find((g) => g.id === id)?.nombre ?? '—'
  const nombreSeccion = (id: string) => secciones.find((s) => s.id === id)?.nombre ?? '—'
  const nombreDocente = (id: string | null) =>
    docentes.find((d) => d.id === id)?.nombre_completo ?? 'Sin asignar'
  const nombreDia = (v: string) => dias.find((d) => d.value === v)?.label ?? v

  const seccionesDelGrado = secciones.filter((s) => s.grado_id === gradoId)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {areas.length} área{areas.length !== 1 && 's'} registrada
          {areas.length !== 1 && 's'}
        </p>
        <button
          onClick={() => setModalAreaAbierto(true)}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          + Agregar área
        </button>
      </div>

      {cargando && <p className="text-center text-sm text-gray-400">Cargando...</p>}

      {!cargando && areas.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          Aún no hay áreas registradas (ej. Matemática, Comunicación).
        </div>
      )}

      <div className="space-y-4">
        {areas.map((area) => {
          const clasesDelArea = clases.filter((c) => c.area_id === area.id)
          return (
            <div key={area.id} className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <span className="font-medium text-gray-800">{area.nombre}</span>
                <div className="flex gap-3 text-xs">
                  <button
                    onClick={() => abrirModalClase(area)}
                    className="text-blue-600 hover:underline"
                  >
                    + Horario de clase
                  </button>
                  <button
                    onClick={() => eliminarArea(area.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar área
                  </button>
                </div>
              </div>

              <div className="px-4 py-3">
                {clasesDelArea.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin horarios configurados.</p>
                ) : (
                  <div className="space-y-2">
                    {clasesDelArea.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-gray-700">
                            {nombreGrado(c.grado_id)} - {nombreSeccion(c.seccion_id)}
                          </span>
                          <span className="ml-2 text-gray-500">
                            {nombreDia(c.dia)} · {c.hora_inicio.slice(0, 5)} - {c.hora_fin.slice(0, 5)}
                          </span>
                          <span className="ml-2 text-gray-400">
                            {nombreDocente(c.docente_id)}
                          </span>
                        </div>
                        <button
                          onClick={() => eliminarClase(c.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: crear área */}
      {modalAreaAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Agregar área</h3>
            <form onSubmit={crearArea} className="space-y-3">
              <input
                name="nombre"
                placeholder="Nombre del área (ej. Matemática)"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAreaAbierto(false)}
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

      {/* Modal: crear horario de clase */}
      {modalClaseAbierto && (
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Agregar horario de clase
            </h3>
            <form onSubmit={crearClase} className="space-y-3">
              <div className="flex gap-3">
                <ComboboxEstilo
                  nombreCampo="grado_id"
                  placeholder="Grado..."
                  valor={gradoId}
                  onChange={(id) => {
                    setGradoId(id)
                    setSeccionId('')
                  }}
                  opciones={grados.map((g) => ({ id: g.id, label: g.nombre }))}
                />
                <ComboboxEstilo
                  nombreCampo="seccion_id"
                  placeholder="Sección..."
                  valor={seccionId}
                  onChange={setSeccionId}
                  deshabilitado={!gradoId}
                  opciones={seccionesDelGrado.map((s) => ({ id: s.id, label: s.nombre }))}
                />
              </div>

              <ComboboxEstilo
                nombreCampo="docente_id"
                placeholder="Maestro asignado..."
                valor={docenteId}
                onChange={setDocenteId}
                opciones={docentes.map((d) => ({ id: d.id, label: d.nombre_completo }))}
              />

              <select
                name="dia"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
              >
                {dias.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <div className="w-full">
                  <label className="mb-1 block text-xs text-gray-500">Hora inicio</label>
                  <input
                    name="hora_inicio"
                    type="time"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="w-full">
                  <label className="mb-1 block text-xs text-gray-500">Hora fin</label>
                  <input
                    name="hora_fin"
                    type="time"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Minutos de apertura anticipada
                </label>
                <input
                  name="minutos"
                  type="number"
                  defaultValue={15}
                  min={0}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalClaseAbierto(false)}
                  className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}