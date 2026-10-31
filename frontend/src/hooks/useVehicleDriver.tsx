import { Typography } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import { useGet } from '@/api/hooks'
import { useLookups } from '@/api/lookups'
import type { DriverSuggestion } from '@/api/types'
import { optionsOf } from '@/components/EntitySelect'

/**
 * Fills the driver from the chosen vehicle: a substitute already used on that vehicle that day wins, else the
 * regular driver (Masters > Staff), skipping anyone marked absent in attendance. A driver the munshi picks by
 * hand is kept until the vehicle changes, and becomes that day's driver for the vehicle's next entries.
 */
export function useVehicleDriver({ vehicleId, date, driverId, setDriver, editing }: {
  vehicleId: number | null | undefined
  date: string | undefined
  driverId: number | null | undefined
  setDriver: (id: number | null) => void
  editing: boolean
}) {
  const lookups = useLookups()
  // While editing, the saved driver stays until the munshi changes the vehicle.
  const picked = useRef(editing)
  const { data, isPlaceholderData } = useGet<DriverSuggestion>(`/masters/vehicles/${vehicleId}/driver`, { on: date }, { enabled: Boolean(vehicleId) })
  const current = vehicleId && !isPlaceholderData ? data : undefined

  useEffect(() => {
    if (current && !picked.current && current.driver_id !== (driverId ?? null)) setDriver(current.driver_id)
  }, [current, driverId, setDriver])

  const absent = useMemo(() => new Set(current?.absent_driver_ids ?? []), [current])
  const options = useMemo(
    () => optionsOf([...lookups.drivers].sort((a, b) => Number(absent.has(a.id)) - Number(absent.has(b.id))), (s) => (absent.has(s.id) ? `${s.name} (absent)` : s.name)),
    [lookups.drivers, absent],
  )

  const name = (id: number | null | undefined) => (id ? lookups.staffById.get(id)?.name ?? '' : '')
  let hint: React.ReactNode = null
  if (vehicleId && current) {
    if (driverId && absent.has(driverId)) hint = <Typography.Text type="warning">{name(driverId)} is marked absent on this day</Typography.Text>
    else if (current.regular_absent && !driverId) hint = <Typography.Text type="warning">{name(current.regular_driver_id)} is absent on this day, pick another driver</Typography.Text>
    else if (driverId && driverId === current.driver_id && current.source === 'today' && driverId !== current.regular_driver_id) hint = 'Driving this vehicle today'
    else if (driverId && driverId === current.regular_driver_id) hint = 'Regular driver'
    else if (!driverId && !current.regular_driver_id) hint = 'No regular driver set for this vehicle'
  }

  return {
    options,
    hint,
    /** Call from the driver select's onChange. */
    onPick: () => { picked.current = true },
    /** Call when the vehicle changes (and after saving a new entry) so the next suggestion applies. */
    release: () => { picked.current = false },
  }
}
