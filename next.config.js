/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['leaflet', 'leaflet.heat', 'react-globe.gl', 'globe.gl', 'three-globe'],
}

module.exports = nextConfig
