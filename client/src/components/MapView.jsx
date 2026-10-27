import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { pinIcons } from '../leafletIcons'

const INDIA_CENTER = [22.5, 79]

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

export default function MapView({ places, onSelect, flyTarget, pickMode, onPick, location }) {
  return (
    <div className="map-wrap">
      <MapContainer center={INDIA_CENTER} zoom={5} className={`map ${pickMode ? 'picking' : ''}`}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo target={flyTarget} />
        <LocationPicker enabled={pickMode} onPick={onPick} />

        {places.map((p) => (
          <Marker
            key={p._id}
            position={[p.lat, p.lng]}
            icon={pinIcons[p.status] ?? pinIcons.anjaan}
            eventHandlers={{ click: () => onSelect(p) }}
          />
        ))}

        {location && <Marker position={[location.lat, location.lng]} />}
      </MapContainer>

      {pickMode && <div className="pick-hint">Click on the map to choose a location</div>}
    </div>
  )
}
