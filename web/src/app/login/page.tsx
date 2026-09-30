'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      setError('Correo o contraseña incorrectos')
      return
    }

    const { data: authData } = await supabase.auth.getUser()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user?.id)
      .single()

    setLoading(false)

    if (!profile) {
      setError('Tu cuenta no tiene un rol asignado. Contacta al Director.')
      return
    }

    const rutasPorRol: Record<string, string> = {
      director: '/dashboard',
      secretaria: '/dashboard',
      docente: '/maestro',
      portero: '/portero',
      apoderado: '/apoderado',
    }

    router.push(rutasPorRol[profile.role] ?? '/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Panel izquierdo con imagen */}
      <div className="relative h-56 w-full md:h-auto md:w-1/2">
        <Image
          src="/crystal.png"
          alt="Kustodia"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 flex flex-col bg-black/20 p-6 text-white md:p-10">
          <h1
            className="font-bold"
            style={{ fontSize: 'clamp(0.977rem, 1.954vw, 1.563rem)' }}
          >
            Kustodia
          </h1>
          <p className="mt-2 max-w-xs text-[0.703rem] font-normal md:text-[0.547rem]">
            explora las posibilidades que te da el programa
          </p>

          <div className="mt-4">
            <p className="text-[0.703rem] font-semibold md:text-[0.547rem]">
              No tienes cuenta?
            </p>
            <a href="#" className="text-[0.547rem] font-light underline md:text-[0.469rem]">
              consultar →
            </a>
          </div>
        </div>
      </div>

      {/* Panel derecho: contenido */}
      <div className="flex w-full flex-1 flex-col bg-white md:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-start px-6 pt-8 md:justify-center md:px-8 md:pt-0">
          <div className="w-full max-w-sm">
            <h2 className="mb-6 text-[0.879rem] md:text-[0.684rem]">
              <span className="font-normal text-gray-800">logear en </span>
              <span
                className="font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, #AAAAAA 0%, #505865 79%, #5378B3 100%)',
                }}
              >
                KUSTODIA
              </span>
            </h2>

            <form onSubmit={handleLogin}>
              <label className="mb-1 block text-[0.879rem] font-bold text-gray-800 md:text-[0.684rem] md:font-semibold">
                correo institucional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-1 w-full rounded border border-gray-300 px-3 py-2 text-[0.781rem] md:text-[0.684rem]"
              />
              <p className="mb-4 text-[0.684rem] font-normal text-gray-500 md:text-[0.586rem]">
                Olvidaste tu correo?{' '}
                <a href="#" className="underline">
                  consultar →
                </a>
              </p>

              <label className="mb-1 block text-[0.879rem] font-bold text-gray-800 md:text-[0.684rem] md:font-semibold">
                Contraseña
              </label>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-[0.781rem] md:text-[0.684rem]"
              />
              <label className="mb-6 mt-1 flex items-center gap-2 text-[0.684rem] font-normal text-gray-500 md:text-[0.586rem]">
                <input
                  type="checkbox"
                  checked={mostrarPassword}
                  onChange={(e) => setMostrarPassword(e.target.checked)}
                  className="h-3 w-3"
                />
                Mostrar contraseña
              </label>

              {error && (
                <p className="mb-4 text-[0.684rem] text-red-600 md:text-[0.586rem]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded py-2.5 text-[0.879rem] font-semibold text-white disabled:opacity-50 md:text-[0.684rem]"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, #727780 0%, #526A91 50%, #9FB0D0 100%)',
                }}
              >
                {loading ? 'Ingresando...' : 'INGRESAR'}
              </button>
            </form>
          </div>
        </div>

        <p className="pb-10 text-center text-[0.586rem] text-gray-400">
          Kustodia &nbsp;|&nbsp; por la seguridad de ellos(as)
        </p>
      </div>
    </div>
  )
}