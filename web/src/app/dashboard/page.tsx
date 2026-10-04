'use client'
import { useState } from 'react'
import EstudiantesSection from './EstudiantesSection'
import ResumenEstudiantesSection from './ResumenEstudiantesSection'
import PersonalSection from './PersonalSection'
import RegistroAcademicoSection from './RegistroAcademicoSection'
import HorariosClasesSection from './HorariosClasesSection'
const menuItems = [
  {
    grupo: 'Control Asistencia',
    items: ['Estudiantes', 'Resumen Estudiantes', 'Personal', 'Resumen Personal'],
  },
  { grupo: 'Registro Académico', items: ['Grados y Secciones'] },
  { grupo: 'Horarios y Clases', items: ['Áreas y Horarios'] },
  { grupo: 'Configuración', items: [] },
]
export default function DashboardPage() {
  const [gruposAbiertos, setGruposAbiertos] = useState<string[]>([])
  const [seccionActiva, setSeccionActiva] = useState('Estudiantes')
  const [anioEscolar, setAnioEscolar] = useState('2026-2027')
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  function elegirSeccion(item: string) {
    setSeccionActiva(item)
    setMenuMovilAbierto(false)
  }
  function alternarGrupo(nombre: string) {
    setGruposAbiertos((prev) =>
      prev.includes(nombre)
        ? prev.filter((g) => g !== nombre)
        : [...prev, nombre]
    )
  }
  const contenidoMenu = (
    <>
      <div className="border-b border-gray-200 p-4">
        <select
          value={anioEscolar}
          onChange={(e) => setAnioEscolar(e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option>2026-2027</option>
          <option>2025-2026</option>
        </select>
      </div>
      <nav className="p-2">
        {menuItems.map((grupo) =>
          grupo.items.length > 0 ? (
            <div key={grupo.grupo} className="mb-1">
              <button
                onClick={() => alternarGrupo(grupo.grupo)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-100"
              >
                {grupo.grupo}
                <span
                  className={`text-xs text-gray-400 transition-transform duration-200 ${
                    gruposAbiertos.includes(grupo.grupo) ? 'rotate-90' : ''
                  }`}
                >
                  ▸
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ${
                  gruposAbiertos.includes(grupo.grupo)
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-3 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                  {grupo.items.map((item) => (
                    <button
                      key={item}
                      onClick={() => elegirSeccion(item)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors duration-150 ${
                        seccionActiva === item
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <button
              key={grupo.grupo}
              onClick={() => elegirSeccion(grupo.grupo)}
              className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ${
                seccionActiva === grupo.grupo
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {grupo.grupo}
            </button>
          )
        )}
      </nav>
      <div className="border-t border-gray-200 p-3 text-xs text-gray-400">
        U.E. COLEGIO DE PRUEBA
      </div>
    </>
  )
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fijo — solo escritorio */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        {contenidoMenu}
      </aside>
      {/* Menú deslizable — solo celular */}
      {menuMovilAbierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setMenuMovilAbierto(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
            {contenidoMenu}
          </aside>
        </div>
      )}
      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setMenuMovilAbierto(true)}
            className="rounded border border-gray-300 p-2 text-gray-600 md:hidden"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            {seccionActiva}
          </h1>
        </div>
        {seccionActiva === 'Estudiantes' ? (
          <EstudiantesSection />
        ) : seccionActiva === 'Resumen Estudiantes' ? (
          <ResumenEstudiantesSection />
        ) : seccionActiva === 'Personal' ? (
          <PersonalSection />
        ) : seccionActiva === 'Grados y Secciones' ? (
          <RegistroAcademicoSection />
        ) : seccionActiva === 'Áreas y Horarios' ? (
          <HorariosClasesSection />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            Aquí va el contenido de &ldquo;{seccionActiva}&rdquo; — lo construimos en el siguiente paso.
          </div>
        )}
      </main>
    </div>
  )
}