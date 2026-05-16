import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getMemberComplianceStatus } from '../lib/compliance'
import type { ComplianceStatus, MemberDocument } from '../types/database.types'

export function useCompliance(memberId: string | undefined, brevet: string | null | undefined) {
  const [compliance, setCompliance] = useState<ComplianceStatus>({
    medical: 'missing',
    expiryDate: null,
    documentType: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!memberId) { setLoading(false); return }

    supabase
      .from('member_documents')
      .select('*')
      .eq('member_id', memberId)
      .in('type', ['certificat_medical', 'caci'])
      .then(({ data }) => {
        const docs = (data ?? []) as MemberDocument[]
        const status = getMemberComplianceStatus(docs, brevet as never)
        setCompliance(status)
        setLoading(false)
      })
  }, [memberId, brevet])

  return { compliance, loading }
}
