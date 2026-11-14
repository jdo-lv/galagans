import { useCallback, useEffect, useState } from 'react'
import { useServices } from './ServicesContext'

export function usePendingCount(): { pending: number; refresh: () => void } {
  const { repository, synchronizer } = useServices()
  const [pending, setPending] = useState(0)

  const refresh = useCallback(() => {
    void repository.countPending().then(setPending)
  }, [repository])

  useEffect(() => {
    refresh()
    return synchronizer.subscribe(refresh)
  }, [refresh, synchronizer])

  return { pending, refresh }
}
