'use client'

import { useState } from 'react'
import { Combobox } from '@headlessui/react'

interface Opcion {
  id: string
  label: string
}

interface Props {
  opciones: Opcion[]
  valor: string
  onChange: (id: string) => void
  placeholder: string
  nombreCampo: string
  deshabilitado?: boolean
}

export default function ComboboxEstilo({
  opciones,
  valor,
  onChange,
  placeholder,
  nombreCampo,
  deshabilitado,
}: Props) {
  const [consulta, setConsulta] = useState('')

  const opcionSeleccionada = opciones.find((o) => o.id === valor)

  const filtradas =
    consulta === ''
      ? opciones
      : opciones.filter((o) =>
          o.label.toLowerCase().includes(consulta.toLowerCase())
        )

  return (
    <Combobox
      value={valor}
      onChange={(id) => id && onChange(id)}
      disabled={deshabilitado}
    >
      <div className="relative">
        <Combobox.Input
          name={nombreCampo}
          displayValue={() => opcionSeleccionada?.label ?? ''}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm shadow-sm transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        />
        {filtradas.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg focus:outline-none">
            {filtradas.map((o) => (
              <Combobox.Option
                key={o.id}
                value={o.id}
                className={({ active }) =>
                  `cursor-pointer px-3 py-2 text-sm ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`
                }
              >
                {o.label}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  )
}