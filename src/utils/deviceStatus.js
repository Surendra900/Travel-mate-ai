import { useEffect, useMemo, useState } from 'react'

function readConnection() {
  if (typeof navigator === 'undefined') return {}
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  return {
    effectiveType: connection?.effectiveType || 'unknown',
    saveData: Boolean(connection?.saveData),
    downlink: typeof connection?.downlink === 'number' ? connection.downlink : null,
    rtt: typeof connection?.rtt === 'number' ? connection.rtt : null,
    supported: Boolean(connection),
    connection
  }
}

export function useDeviceStatus() {
  const initialConnection = readConnection()
  const [status, setStatus] = useState({
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    batteryLevel: null,
    charging: null,
    effectiveType: initialConnection.effectiveType || 'unknown',
    saveData: Boolean(initialConnection.saveData),
    downlink: initialConnection.downlink,
    rtt: initialConnection.rtt,
    supported: {
      battery: false,
      network: Boolean(initialConnection.supported)
    }
  })

  useEffect(() => {
    let batteryRef = null
    const updateOnline = () => setStatus((old) => ({ ...old, online: navigator.onLine }))
    const updateConnection = () => {
      const next = readConnection()
      setStatus((old) => ({
        ...old,
        effectiveType: next.effectiveType || 'unknown',
        saveData: Boolean(next.saveData),
        downlink: next.downlink,
        rtt: next.rtt,
        supported: { ...old.supported, network: Boolean(next.supported) }
      }))
    }
    const updateBattery = () => {
      if (!batteryRef) return
      setStatus((old) => ({
        ...old,
        batteryLevel: Math.round(batteryRef.level * 100),
        charging: batteryRef.charging,
        supported: { ...old.supported, battery: true }
      }))
    }

    const connection = readConnection().connection
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    connection?.addEventListener?.('change', updateConnection)

    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        batteryRef = battery
        updateBattery()
        battery.addEventListener('levelchange', updateBattery)
        battery.addEventListener('chargingchange', updateBattery)
      }).catch(() => {})
    }

    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
      connection?.removeEventListener?.('change', updateConnection)
      if (batteryRef) {
        batteryRef.removeEventListener('levelchange', updateBattery)
        batteryRef.removeEventListener('chargingchange', updateBattery)
      }
    }
  }, [])

  const recommendedMode = useMemo(() => {
    if (!status.online) return 'low-network'

    // Do not over-trigger Low Signal Mode on phones that still show 4G/5G.
    // Some browsers report temporary low downlink/RTT or Save-Data even when browsing is usable.
    // Auto low-signal is used only for clearly bad conditions.
    const verySlowNetwork = ['slow-2g', '2g'].includes(status.effectiveType)
    const deadLikeMetrics = status.downlink !== null && status.rtt !== null && status.downlink < 0.25 && status.rtt > 1500
    const criticalBattery = status.batteryLevel !== null && status.batteryLevel <= 8 && !status.charging

    if (verySlowNetwork || deadLikeMetrics || criticalBattery) return 'low-network'
    return 'normal'
  }, [status])

  return { ...status, recommendedMode }
}
