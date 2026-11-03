import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { highlightIcon, newPlaceIcon, pinIcons, searchIcon } from '../leafletIcons'

// Jab flyTarget badlta hai, mini map us jagah par fly karta hai
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom ?? 15, { duration: 1 })
  }, [target, map])
  return null
}

// Khali jagah par click: enabled ho to nayi location do
function ClickHandler({ enabled, onMapClick }) {
  useMapEvents({
    click(e) {
      if (enabled) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// Form khulne par container ka size badalta hai, Leaflet ko batao taaki tiles na toot-een
function ResizeFix() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

// Form ke andar chhota map: saare pins dikhata hai, aur location chunne deta hai
export default function MiniMap({
  places,
  location,
  flyTarget,
  locked,
  searchMarker,
  highlightId,
  onMapClick,
  onPinClick,
  onMarkerDrag,
  onSearchMarkerClick,
}) {
  return (
    <MapContainer center={[22.5, 79]} zoom={5} minZoom={4} className="mini-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo target={flyTarget} />
      <ClickHandler enabled={!locked} onMapClick={onMapClick} />
      <ResizeFix />

      {places.map((p) => (
        <Marker
          key={p._id}
          position={[p.lat, p.lng]}
          icon={
            p._id === highlightId
              ? highlightIcon(p.status)
              : p.status === 'anjaan'
                ? pinIcons.anjaan
                : pinIcons.verified
          }
          // Sirf peele (anjaan) pin par click ka matlab hai
          eventHandlers={p.status === 'anjaan' ? { click: () => onPinClick(p) } : {}}
        />
      ))}

      {/* Search result ka alag rang ka marker: click karne par wahi jagah location ban jaati hai */}
      {searchMarker && (
        <Marker
          position={[searchMarker.lat, searchMarker.lng]}
          icon={searchIcon}
          zIndexOffset={500}
          eventHandlers={{
            click: () => !locked && onSearchMarkerClick({ lat: searchMarker.lat, lng: searchMarker.lng }),
          }}
        />
      )}

      {location && (
        <Marker
          position={[location.lat, location.lng]}
          icon={newPlaceIcon}
          draggable={!locked}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng()
              onMarkerDrag({ lat, lng })
            },
          }}
        />
      )}
    </MapContainer>
  )
}
