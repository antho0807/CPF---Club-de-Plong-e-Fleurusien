import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter.')
      } else {
        setError('Email ou mot de passe incorrect.')
      }
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0077b6] to-[#023e8a] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-cpf.png" alt="CPF" className="w-24 h-24 object-contain mx-auto mb-3 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white">CPF Plongée</h1>
          <p className="text-blue-200 text-sm mt-1">Club de Plongée Fleurusien · LIFRAS/CMAS</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Connexion</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  placeholder="votre@email.com"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connexion…</>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
            <p>
              <Link to="/forgot-password" className="text-[#0077b6] font-medium hover:underline">
                Mot de passe oublié ?
              </Link>
            </p>
            <p>
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-[#0077b6] font-medium hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          LIFRAS asbl / CMAS Belgium
        </p>
      </div>
    </div>
  )
}
