import { useEffect, useMemo, useState } from 'react'
import {
  GeoJSON,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { pinIcons, trailIcon } from '../leafletIcons'
import { useLanguage } from '../i18n/LanguageContext'

const INDIA_CENTER = [22.5, 79]
// India ke bounding box (lat 6.7-37.1, lng 68.1-97.4) ke around thoda padding
const INDIA_BOUNDS = [
  [4, 66],
  [39, 99.5],
]
const WORLD_RING = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
]

// Jab flyTarget badlta hai, map us jagah par ud kar pahunchta hai
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom ?? 13, { duration: 1.2 })
  }, [target, map])
  return null
}

// Pick mode on ho to map par click se location milti hai
function LocationPicker({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// Jab map ka container size badle (drag ya fullscreen), Leaflet ko batao taaki tiles na toot-een
function InvalidateOnResize() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

// Trail ke stops ko numbered markers aur dashed line se dikhata hai, aur map ko sab stops par fit karta hai
function TrailLayer({ stops }) {
  const map = useMap()
  // Fit sirf tab ho jab trail ke stops badlein (places update hone par nahi)
  const stopKey = stops.map((p) => p._id).join(',')

  useEffect(() => {
    map.fitBounds(
      stops.map((p) => [p.lat, p.lng]),
      { padding: [40, 40] },
    )
  }, [stopKey, map])

  return (
    <>
      <Polyline
        positions={stops.map((p) => [p.lat, p.lng])}
        pathOptions={{ color: '#b5532e', weight: 3, dashArray: '8 6' }}
        interactive={false}
      />
      {stops.map((p, i) => (
        <Marker
          key={p._id}
          position={[p.lat, p.lng]}
          icon={trailIcon(i + 1)}
          zIndexOffset={1000}
        />
      ))}
    </>
  )
}

export default function MapView({
  places,
  onSelect,
  flyTarget,
  pickMode,
  onPick,
  location,
  fullscreen,
  onToggleFullscreen,
  trailStops,
}) {
  const { t } = useLanguage()
  const [india, setIndia] = useState(null)

  // public/data/india-boundary.geojson se India ka outline lo
  useEffect(() => {
    let ignore = false
    fetch('/data/india-boundary.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setIndia(data)
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  // Mask: poori duniya ek ring, aur India ke saare rings uske "holes" ban jaate hain
  const maskPositions = useMemo(() => {
    if (!india) return null
    const holes = []
    for (const feature of india.features) {
      const polygons =
        feature.geometry.type === 'MultiPolygon'
          ? feature.geometry.coordinates
          : [feature.geometry.coordinates]
      for (const polygon of polygons) {
        for (const ring of polygon) {
          // GeoJSON [lng, lat] ko Leaflet [lat, lng] mein badlo
          holes.push(ring.map(([lng, lat]) => [lat, lng]))
        }
      }
    }
    return [WORLD_RING, ...holes]
  }, [india])

  return (
    <div className="map-wrap">
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        minZoom={4}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        className={`map ${pickMode ? 'picking' : ''}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {maskPositions && (
          <Polygon
            positions={maskPositions}
            pathOptions={{ stroke: false, fillColor: '#6b6375', fillOpacity: 0.45 }}
            interactive={false}
          />
        )}
        {india && (
          <GeoJSON
            data={india}
            style={{ color: '#8f3e20', weight: 1.5, fill: false }}
            interactive={false}
          />
        )}

        <FlyTo target={flyTarget} />
        <LocationPicker enabled={pickMode} onPick={onPick} />
        <InvalidateOnResize />

        {places.map((p) => (
          <Marker
            key={p._id}
            position={[p.lat, p.lng]}
            icon={pinIcons[p.status] ?? pinIcons.anjaan}
            eventHandlers={{ click: () => onSelect(p) }}
          />
        ))}

        {location && <Marker position={[location.lat, location.lng]} />}

        {trailStops && trailStops.length > 0 && <TrailLayer stops={trailStops} />}
      </MapContainer>

      <button className="fullscreen-btn" onClick={onToggleFullscreen}>
        ⛶ {fullscreen ? t('exitFullscreen') : t('fullscreen')}
      </button>

      {pickMode && <div className="pick-hint">{t('pickHint')}</div>}
    </div>
  )
}
