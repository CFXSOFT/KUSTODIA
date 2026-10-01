'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Persona {
  id: string
  role: string
  nombre_completo: string
}

const rolesDisponibles = [
  { value: 'docente', label: 'Maestro' },
  { value: 'portero', label: 'Portero' },
  { value: 'secretaria', label: 'Secretaría' },
]

export default function PersonalSection() {
  const [personal, setPersonal] = useState<Persona[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const cargarPersonal = useCallback(async () => {
    setCargando(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, role, nombre_completo')
      .in('role', ['docente', 'portero', 'secretaria'])
      .order('nombre_completo')
    setPersonal(data ?? [])
    setCargando(false)
  }, [supabase])

  useEffect(() => {
    cargarPersonal()
  }, [cargarPersonal])

  async function crearPersona(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/personal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_completo: form.get('nombre_completo'),
        correo: form.get('correo'),
        password: form.get('password'),
        role: form.get('role'),
      }),
    })

    const data = await res.json()
    setGuardando(false)

    if (!res.ok) {
      setError(data.error ?? 'Ocurrió un error')
      return
    }

    setModalAbierto(false)
    cargarPersonal()
  }

  async function eliminarPersona(id: string, nombre: string) {
    if (!confirm(`¿Eliminar la cuenta de ${nombre}? Esta acción no se puede deshacer.`))
      return

    const res = await fetch('/api/personal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) cargarPersonal()
  }

  const etiquetaRol = (role: string) =>
    rolesDisponibles.find((r) => r.value === role)?.label ?? role

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {personal.length} cuenta{personal.length !== 1 && 's'} de personal
        </p>
        <button
          onClick={() => {
            setError(null)
            setModalAbierto(true)
          }}
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          + Crear cuenta
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargando && personal.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Aún no hay personal registrado.
                </td>
              </tr>
            )}
            {personal.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {p.nombre_completo}
                </td>
                <td className="px-4 py-3 text-gray-600">{etiquetaRol(p.role)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => eliminarPersona(p.id, p.nombre_completo)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Crear cuenta de personal
            </h3>
            <form onSubmit={crearPersona} className="space-y-3">
              <input
                name="nombre_completo"
                placeholder="Nombre completo"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                name="role"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {rolesDisponibles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <input
                name="correo"
                type="email"
                placeholder="correo institucional"
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="password"
                type="text"
                placeholder="Contraseña temporal"
                required
                minLength={6}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  {guardando ? 'Creando...' : 'Crear cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}