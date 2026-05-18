import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'

const schema = z.object({
  fullName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  dateNaissance: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    const { data: authData, error } = await signUp(data.email, data.password, data.fullName)
    if (error) {
      setError(error.message)
    } else {
      // Sauvegarder la date de naissance si fournie (le profil est créé par le trigger SQL)
      if (data.dateNaissance && authData?.user?.id) {
        await import('../../lib/supabase').then(({ supabase }) =>
          supabase.from('profiles').update({ date_naissance: data.dateNaissance }).eq('id', authData.user!.id)
        )
      }
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0077b6] to-[#023e8a] px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Inscription envoyée !</h2>
          <p className="text-gray-600 text-sm mb-3">
            Vérifiez votre email pour confirmer votre adresse.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Une fois l'email confirmé, votre compte sera en attente de validation par un administrateur du club. Vous recevrez un accès dès l'approbation.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Retour à la connexion
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0077b6] to-[#023e8a] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-cpf.png" alt="CPF" className="w-24 h-24 object-contain mx-auto mb-3 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white">CPF Plongée</h1>
          <p className="text-blue-200 text-sm mt-1">Créer un compte</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Inscription</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nom complet</Label>
              <Input id="fullName" className="mt-1" placeholder="Jean Dupont" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-1" placeholder="votre@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="dateNaissance">
                Date de naissance <span className="text-gray-400 text-xs">(optionnel — affichée dans le calendrier du club 🎂)</span>
              </Label>
              <Input id="dateNaissance" type="date" className="mt-1" {...register('dateNaissance')} />
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" className="mt-1" placeholder="Minimum 8 caractères" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input id="confirmPassword" type="password" className="mt-1" placeholder="••••••••" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Inscription…</> : "S'inscrire"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-[#0077b6] font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
