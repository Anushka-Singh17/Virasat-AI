import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Vite mein Leaflet ka default marker icon ka path toot jaata hai.
// Isliye icon ke image files khud import karke Leaflet ko dete hain.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Apne colored pins (green = verified, yellow = anjaan)
export const pinIcons = {
  verified: L.divIcon({
    className: 'pin-wrapper',
    html: '<span class="pin pin-verified"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  }),
  anjaan: L.divIcon({
    className: 'pin-wrapper',
    html: '<span class="pin pin-anjaan"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  }),
}

// Trail ke numbered markers (1, 2, 3...). Har number ka icon ek baar banakar cache karte hain
const trailIcons = {}
export function trailIcon(n) {
  if (!trailIcons[n]) {
    trailIcons[n] = L.divIcon({
      className: 'pin-wrapper',
      html: `<span class="trail-marker">${n}</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }
  return trailIcons[n]
}

// Search result: pin nahi, sirf ek chhota pulsing circle (area dikhane ke liye)
export const searchIcon = L.divIcon({
  className: 'pin-wrapper',
  html: '<span class="search-pulse"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

// User ki chuni hui NAYI location: laal pin (default neela marker ki jagah)
export const newPlaceIcon = L.divIcon({
  className: 'pin-wrapper',
  html: '<span class="pin pin-new"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

// Highlight kiya hua pin: bada aur glow ke saath. Har rang ka icon ek baar banakar cache karte hain
const highlightIcons = {}
export function highlightIcon(status) {
  const kind = status === 'anjaan' ? 'anjaan' : 'verified'
  if (!highlightIcons[kind]) {
    highlightIcons[kind] = L.divIcon({
      className: 'pin-wrapper',
      html: `<span class="pin pin-${kind} pin-highlight"></span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })
  }
  return highlightIcons[kind]
}
