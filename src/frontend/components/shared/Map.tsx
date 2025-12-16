"use client";

import { APIProvider, Map as GoogleMap, Marker } from '@vis.gl/react-google-maps';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

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
                <p className="text-xs">Google Maps API key is missing.</p>
                <p className="text-xs mt-2">Please add <code className="bg-secondary px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables.</p>
            </div>
        </div>
    );
  }

  const position = { lat, lng };

  return (
    <APIProvider apiKey={API_KEY}>
      <GoogleMap
        defaultCenter={position}
        defaultZoom={15}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId="civitas-map"
        className='w-full h-full'
      >
        <Marker position={position} />
      </GoogleMap>
    </APIProvider>
  );
}
