'use client'

/**
 * StreetViewButton — opens Google Street View at the given coordinates.
 * No API key required. No external dependencies.
 */
export default function StreetViewButton({ lat, lng, className = '' }) {
  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`sv-btn ${className}`}
    >
      📍 Open Street View
    </a>
  )
}
