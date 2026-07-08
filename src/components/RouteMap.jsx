import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Map, Navigation } from 'lucide-react'
import { findTransportPlace, routeCombos } from '../data/transportData'

const segmentColors = {
  Train: '#22d3ee',
  Flight: '#f97316',
  Bus: '#a3e635'
}

function findPlace(city) {
  return findTransportPlace(city)
}

function midpoint(a, b, offset = 0) {
  return [
    (a[0] + b[0]) / 2 + offset,
    (a[1] + b[1]) / 2 + offset
  ]
}

function pathForPlan(plan) {
  const from = findPlace(plan.from) || findPlace('Hyderabad')
  const to = findPlace(plan.to) || findPlace('Delhi')
  const combo = routeCombos.find((item) => item.label === plan.routeCombo) || routeCombos[0]
  const start = [from.lat, from.lng]
  const end = [to.lat, to.lng]

  if (combo.sequence.length === 1) {
    return { combo, points: [start, end], labels: [from.city, to.city] }
  }

  const stop = midpoint(start, end, combo.sequence[0] === 'Flight' ? 2.2 : -1.8)
  return { combo, points: [start, stop, end], labels: [from.city, 'Transfer hub', to.city] }
}

export default function RouteMap({ plan }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const route = useMemo(() => pathForPlan(plan), [plan.from, plan.to, plan.routeCombo])

  useEffect(() => {
    if (!containerRef.current) return undefined

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false
      }).setView([22.9, 79.2], 5)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(mapRef.current)
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)
    }

    const map = mapRef.current
    const layer = L.layerGroup().addTo(map)
    const latLngs = route.points.map(([lat, lng]) => L.latLng(lat, lng))

    route.points.forEach(([lat, lng], index) => {
      L.circleMarker([lat, lng], {
        radius: index === 0 || index === route.points.length - 1 ? 8 : 6,
        color: '#ffffff',
        weight: 2,
        fillColor: index === 0 ? '#22d3ee' : index === route.points.length - 1 ? '#fb7185' : '#facc15',
        fillOpacity: 0.95
      }).bindTooltip(route.labels[index], { permanent: index !== 1, direction: 'top' }).addTo(layer)
    })

    const bounds = L.latLngBounds(latLngs)
    map.fitBounds(bounds.pad(0.35), { animate: true })

    route.combo.sequence.forEach((mode, index) => {
      const from = latLngs[index]
      const to = latLngs[index + 1]
      const steps = 36
      let current = 1
      const animated = L.polyline([from], {
        color: segmentColors[mode] || '#22d3ee',
        weight: 5,
        opacity: 0.9,
        dashArray: mode === 'Flight' ? '10 10' : mode === 'Bus' ? '4 8' : undefined
      }).addTo(layer)
      const timer = window.setInterval(() => {
        const progress = Math.min(current / steps, 1)
        animated.setLatLngs([
          from,
          L.latLng(
            from.lat + (to.lat - from.lat) * progress,
            from.lng + (to.lng - from.lng) * progress
          )
        ])
        current += 1
        if (progress >= 1) window.clearInterval(timer)
      }, 24 + index * 20)
    })

    return () => {
      layer.remove()
    }
  }, [route])

  return (
    <div className="glass overflow-hidden rounded-3xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cyan-200">Live route map visualization</p>
          <h3 className="text-2xl font-black text-white">India journey path</h3>
        </div>
        <span className="badge"><Map size={14} /> Leaflet.js · OSM tiles · offline fallback</span>
      </div>
      <div ref={containerRef} className="h-[320px] overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950" aria-label="India route map. If offline, saved route text below remains available." />
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
        {route.combo.sequence.map((mode) => (
          <span key={mode} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5"><Navigation className="mr-1 inline" size={13} />{mode}</span>
        ))}
        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5">{plan.from} → {plan.to}</span>
      </div>
    </div>
  )
}
