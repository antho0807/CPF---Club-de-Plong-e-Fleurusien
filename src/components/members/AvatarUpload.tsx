import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AvatarDisplay } from './AvatarDisplay'

interface Props {
  userId: string
  name: string
  currentUrl?: string | null
  onUploaded: (url: string) => void
}

export function AvatarUpload({ userId, name, currentUrl, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 5 MB)')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      // Forcer une URL fraîche avec timestamp pour éviter le cache
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const freshUrl = `${data.publicUrl}?t=${Date.now()}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any).update({ avatar_url: freshUrl }).eq('id', userId)
      onUploaded(freshUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group cursor-pointer" onClick={() => !uploading && inputRef.current?.click()}>
        <AvatarDisplay avatarUrl={currentUrl} name={name} size="xl" />
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading
            ? <Loader2 className="h-6 w-6 text-white animate-spin" />
            : <Camera className="h-6 w-6 text-white" />
          }
        </div>
      </div>
      <p className="text-xs text-gray-400">Cliquer pour changer la photo</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
    </div>
  )
}
