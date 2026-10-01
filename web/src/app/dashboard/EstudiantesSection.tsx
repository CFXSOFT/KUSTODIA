'use client'

import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import ComboboxEstilo from './ComboboxEstilo'

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

interface Estudiante {
  id: string
  codigo_qr: string
  nombre_completo: string
  cedula: string
  grado_id: string | null
  seccion_id: string | null
  foto_url: string | null
  apoderado_nombre: string | null
  apoderado_telefono: string | null
  apoderado_correo: string | null
}

export default function EstudiantesSection() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Estudiante | null>(null)
  const [gradoSeleccionado, setGradoSeleccionado] = useState('')
  const [seccionSeleccionada, setSeccionSeleccionada] = useState('')
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null)
  const [qrVisible, setQrVisible] = useState<{ est: Estudiante; dataUrl: string } | null>(null)

  const supabase = createClient()

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    const [{ data: est }, { data: g }, { data: s }] = await Promise.all([
      supabase.from('estudiantes').select('*').order('nombre_completo'),
      supabase.from('grados').select('*').order('nombre'),
      supabase.from('secciones').select('*').order('nombre'),
    ])
    setEstudiantes(est ?? [])
    setGrados(g ?? [])
    setSecciones(s ?? [])
    setCargando(false)
  }, [supabase])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  function nombreGrado(id: string | null) {
    return grados.find((g) => g.id === id)?.nombre ?? '—'
  }
  function nombreSeccion(id: string | null) {
    return secciones.find((s) => s.id === id)?.nombre ?? '—'
  }
  function nivelDeGrado(id: string | null) {
    return grados.find((g) => g.id === id)?.nivel ?? '—'
  }

  async function guardarEstudiante(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGuardando(true)
    const form = new FormData(e.currentTarget)

    let foto_url = editando?.foto_url ?? null

    if (fotoArchivo) {
      const extension = fotoArchivo.name.split('.').pop()
      const ruta = `${form.get('cedula')}-${Date.now()}.${extension}`
      const { error: errorSubida } = await supabase.storage
        .from('fotos-estudiantes')
        .upload(ruta, fotoArchivo)

      if (errorSubida) {
        alert(`No se pudo subir la foto: ${errorSubida.message}`)
        setGuardando(false)
        return
      }

      const { data: publicUrl } = supabase.storage
        .from('fotos-estudiantes')
        .getPublicUrl(ruta)
      foto_url = publicUrl.publicUrl
    }

    const datos = {
      nombre_completo: form.get('nombre_completo') as string,
      cedula: form.get('cedula') as string,
      grado_id: form.get('grado_id') as string,
      seccion_id: form.get('seccion_id') as string,
      apoderado_nombre: form.get('apoderado_nombre') as string,
      apoderado_telefono: form.get('apoderado_telefono') as string,
      apoderado_correo: form.get('apoderado_correo') as string,
      foto_url,
    }

    let error
    if (editando) {
      ;({ error } = await supabase
        .from('estudiantes')
        .update(datos)
        .eq('id', editando.id))
    } else {
      const codigo_qr = `KUS-${datos.cedula}-${Date.now()}`
      ;({ error } = await supabase
        .from('estudiantes')
        .insert({ ...datos, codigo_qr }))
    }

    setGuardando(false)

    if (error) {
      alert(`No se pudo guardar: ${error.message}`)
      return
    }

    cerrarModal()
    cargarDatos()
  }

  function cerrarModal() {
    setModalAbierto(false)
    setEditando(null)
    setGradoSeleccionado('')
    setSeccionSeleccionada('')
    setFotoArchivo(null)
  }

  function abrirEdicion(est: Estudiante) {
    setEditando(est)
    setGradoSeleccionado(est.grado_id ?? '')
    setSeccionSeleccionada(est.seccion_id ?? '')
    setModalAbierto(true)
  }

  async function eliminarEstudiante(id: string) {
    if (!confirm('¿Eliminar este estudiante? Esta acción no se puede deshacer.')) return
    await supabase.from('estudiantes').delete().eq('id', id)
    cargarDatos()
  }

  async function mostrarQR(est: Estudiante) {
    const dataUrl = await QRCode.toDataURL(est.codigo_qr, { width: 300, margin: 1 })
    setQrVisible({ est, dataUrl })
  }

  const seccionesDelGradoSeleccionado = secciones.filter(
    (s) => s.grado_id === gradoSeleccionado
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {estudiantes.length} estudiante{estudiantes.length !== 1 && 's'} registrado{estudiantes.length !== 1 && 's'}
        </p>
        <button
          onClick={() => setModalAbierto(true)}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          + Registrar estudiante
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
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
                <td className="flex items-center gap-2 px-4 py-3 font-medium text-gray-800">
                  {est.foto_url ? (
                    <img
                      src={est.foto_url}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                      {est.nombre_completo[0]}
                    </span>
                  )}
                  {est.nombre_completo}
                </td>
                <td className="px-4 py-3 text-gray-600">{est.cedula}</td>
                <td className="px-4 py-3 text-gray-600">
                  {nivelDeGrado(est.grado_id)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {nombreGrado(est.grado_id)} - {nombreSeccion(est.seccion_id)}
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
                      onClick={() => abrirEdicion(est)}
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
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
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

              <div className="flex gap-3">
                <ComboboxEstilo
                  nombreCampo="grado_id"
                  placeholder="Grado..."
                  valor={gradoSeleccionado}
                  onChange={(val) => {
                    setGradoSeleccionado(val)
                    setSeccionSeleccionada('')
                  }}
                  opciones={grados.map((g) => ({
                    id: g.id,
                    label: `${g.nombre} (${g.nivel})`,
                  }))}
                />
                <ComboboxEstilo
                  nombreCampo="seccion_id"
                  placeholder="Sección..."
                  valor={seccionSeleccionada}
                  onChange={setSeccionSeleccionada}
                  deshabilitado={!gradoSeleccionado}
                  opciones={seccionesDelGradoSeleccionado.map((s) => ({
                    id: s.id,
                    label: s.nombre,
                  }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Foto del estudiante
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoArchivo(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
              </div>

              <hr className="my-2" />
              <p className="text-xs font-medium text-gray-500">Datos del apoderado</p>

              <input
                name="apoderado_nombre"
                defaultValue={editando?.apoderado_nombre ?? ''}
                placeholder="Nombre del apoderado"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="apoderado_telefono"
                defaultValue={editando?.apoderado_telefono ?? ''}
                placeholder="Teléfono (WhatsApp)"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="apoderado_correo"
                type="email"
                defaultValue={editando?.apoderado_correo ?? ''}
                placeholder="Correo (opcional)"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
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

      {/* Credencial / QR */}
      {qrVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-[#1a2456] text-white">
            <div className="bg-[#0f1740] py-3 text-center text-sm font-bold tracking-wide">
              CREDENCIAL ESTUDIANTIL
            </div>
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-4">
                {qrVisible.est.foto_url ? (
                  <img
                    src={qrVisible.est.foto_url}
                    alt=""
                    className="h-28 w-24 rounded border-2 border-white/30 object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-24 items-center justify-center rounded border-2 border-white/30 bg-white/10 text-3xl">
                    {qrVisible.est.nombre_completo[0]}
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold uppercase leading-tight">
                    {qrVisible.est.nombre_completo}
                  </p>
                  <p className="text-sm text-white/70">
                    {nivelDeGrado(qrVisible.est.grado_id)}
                  </p>
                  <p className="mt-3 text-xs text-white/50">GRADO / SECCIÓN</p>
                  <p className="text-sm font-semibold">
                    {nombreGrado(qrVisible.est.grado_id)} - {nombreSeccion(qrVisible.est.seccion_id)}
                  </p>
                  <p className="mt-3 text-xs text-white/50">CÉDULA</p>
                  <p className="text-sm font-semibold">{qrVisible.est.cedula}</p>
                </div>
              </div>
              <div className="rounded-lg bg-white p-3">
                <img src={qrVisible.dataUrl} alt="Código QR" className="h-36 w-36" />
              </div>
            </div>
            <button
              onClick={() => setQrVisible(null)}
              className="w-full bg-[#0f1740] py-3 text-sm font-medium hover:bg-[#152052]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}