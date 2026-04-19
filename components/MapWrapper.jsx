'use client'

import dynamic from 'next/dynamic'

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#040810' }}>
      <div style={{ fontFamily: 'Orbitron,monospace', fontSize: 13, color: '#00b4ff', letterSpacing: '.15em' }}>
        LOADING MAP...
      </div>
    </div>
  ),
})

export default function MapWrapper(props) {
  return <MapInner {...props} />
}

