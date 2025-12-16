"use client";

import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const API_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

type MapComponentProps = {
  lat: number;
  lng: number;
};

export default function MapComponent({ lat, lng }: MapComponentProps) {
  if (!API_KEY) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-lg">
        <div className="text-center text-muted-foreground p-4">
          <p className="font-semibold">Map not available</p>
          <p className="text-xs">MapTiler API key is missing.</p>
          <p className="text-xs mt-2">Please add <code className="bg-secondary px-1 py-0.5 rounded">NEXT_PUBLIC_MAPTILER_KEY</code> to your environment variables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden">
      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: 14
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${API_KEY}`}
      >
        <Marker longitude={lng} latitude={lat} color="red" />
        <NavigationControl position="top-right" />
      </Map>
    </div>
  );
}
