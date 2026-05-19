import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'

const schema = z.object({
  newPassword: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})
type Form = z.infer<typeof schema>

export function SecurityTab() {
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (!error) { setSuccess(true); reset(); setTimeout(() => setSuccess(false), 4000) }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-gray-700">🔒 Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {success && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm mb-4">
              <CheckCircle className="h-4 w-4" /> Mot de passe mis à jour.
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label>Nouveau mot de passe</Label>
              <Input type="password" className="mt-1" placeholder="Minimum 8 caractères" {...register('newPassword')} />
              {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <Label>Confirmer le mot de passe</Label>
              <Input type="password" className="mt-1" placeholder="••••••••" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour…</> : 'Changer le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
