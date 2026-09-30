'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import jsQR from 'jsqr'

type TipoRegistro = 'entrada' | 'salida'

interface Resultado {
  tipo: TipoRegistro
  codigo: string
  hora: string
}

export default function PorteroPage() {
  const [camaraEncendida, setCamaraEncendida] = useState(false)
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>('entrada')
  const [dispositivos, setDispositivos] = useState<MediaDeviceInfo[]>([])
  const [dispositivoId, setDispositivoId] = useState<string>('')
  const [autoCierre, setAutoCierre] = useState(true)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  // Lista las cámaras disponibles apenas carga la página
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((lista) => {
      const camaras = lista.filter((d) => d.kind === 'videoinput')
      setDispositivos(camaras)
      if (camaras.length > 0) setDispositivoId(camaras[0].deviceId)
    })
  }, [])

  const detenerCamara = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCamaraEncendida(false)
  }, [])

  const escanear = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(escanear)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const codigo = jsQR(imageData.data, imageData.width, imageData.height)

    if (codigo) {
      setResultado({
        tipo: tipoRegistro,
        codigo: codigo.data,
        hora: new Date().toLocaleString('es-PE'),
      })
      return // pausa el escaneo mientras se muestra la confirmación
    }

    animationRef.current = requestAnimationFrame(escanear)
  }, [tipoRegistro])

  const encenderCamara = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: dispositivoId ? { deviceId: { exact: dispositivoId } } : true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCamaraEncendida(true)
      animationRef.current = requestAnimationFrame(escanear)
    } catch (err) {
      alert('No se pudo acceder a la cámara. Revisa los permisos del navegador.')
    }
  }, [dispositivoId, escanear])

  // Si ya hay un resultado mostrado, no seguir escaneando
  useEffect(() => {
    if (resultado && animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [resultado])

  function cerrarConfirmacion() {
    setResultado(null)
    if (camaraEncendida) {
      animationRef.current = requestAnimationFrame(escanear)
    }
  }

  // Auto-cierre: cierra la tarjeta sola después de 3 segundos
  useEffect(() => {
    if (resultado && autoCierre) {
      const timeout = setTimeout(cerrarConfirmacion, 3000)
      return () => clearTimeout(timeout)
    }
  }, [resultado, autoCierre])

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-gray-500"
        >
          ← regresar
        </button>
        <div className="text-right">
          <h1 className="text-sm font-bold text-gray-800">
            CAMARA REGISTRO
          </h1>
          <p className="text-xs text-gray-500">
            acceso: <span className="italic">PORTERO</span>
          </p>
        </div>
      </div>

      {/* Vista de cámara */}
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
        {!camaraEncendida && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3/4 w-3/4 rounded-lg border-2 border-white/60" />
          </div>
        )}
      </div>

      <button
        onClick={camaraEncendida ? detenerCamara : encenderCamara}
        className="mb-6 w-full rounded bg-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
      >
        {camaraEncendida ? 'APAGAR' : 'ENCENDER'}
      </button>

      {/* Tipo de registro */}
      <p className="mb-2 text-sm font-medium text-gray-700">
        Tipo de REGISTRO
      </p>
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setTipoRegistro('entrada')}
          className={`flex-1 rounded border py-2 text-sm ${
            tipoRegistro === 'entrada'
              ? 'border-green-500 text-green-600'
              : 'border-gray-300 text-gray-500'
          }`}
        >
          ✓ entrada
        </button>
        <button
          onClick={() => setTipoRegistro('salida')}
          className={`flex-1 rounded border py-2 text-sm ${
            tipoRegistro === 'salida'
              ? 'border-red-500 text-red-600'
              : 'border-gray-300 text-gray-500'
          }`}
        >
          ↗ salida
        </button>
      </div>

      {/* Selección de cámara */}
      <p className="mb-2 text-sm font-medium text-gray-700">
        Seleccionar Cámara
      </p>
      <select
        value={dispositivoId}
        onChange={(e) => setDispositivoId(e.target.value)}
        className="mb-6 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      >
        {dispositivos.map((d, i) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `cámara ${i}`}
          </option>
        ))}
      </select>

      {/* Auto cierre */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoCierre(!autoCierre)}
            className={`h-6 w-11 rounded-full transition ${
              autoCierre ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white transition ${
                autoCierre ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">auto cierre</span>
        </div>
        <p className="max-w-[45%] text-right text-xs text-gray-500">
          sirve para cerrar automáticamente el perfil de estudiante registrado
        </p>
      </div>

      {/* Tarjeta de confirmación */}
      {resultado && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl text-green-600">✓</span>
            </div>
            <h3 className="mb-4 text-lg font-bold text-green-600">
              {resultado.tipo.toUpperCase()} registrada
            </h3>
            <div className="space-y-2 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Código leído</span>
                <span className="font-medium">{resultado.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha - hora</span>
                <span className="font-medium">{resultado.hora}</span>
              </div>
            </div>
            <button
              onClick={cerrarConfirmacion}
              className="mt-6 w-full rounded bg-gray-700 py-2 text-sm text-white"
            >
              cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}