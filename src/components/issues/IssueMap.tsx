"use client";

import { useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, ScaleControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Issue } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

interface IssueMapProps {
    issues: Issue[];
}

export function IssueMap({ issues }: IssueMapProps) {
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

    // Default to a central location (e.g. New York or user's location) if no issues
    // or calculate bounds. For now, hardcode a default view or first issue.
    const initialViewState = {
        longitude: issues[0]?.location.lng || -74.006,
        latitude: issues[0]?.location.lat || 40.7128,
        zoom: 11
    };

    return (
        <Card className="w-full h-[500px] overflow-hidden border-border/50 shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                    Community Issues Map
                </CardTitle>
            </CardHeader>
            <div className="relative w-full h-full">
                <Map
                    initialViewState={initialViewState}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="https://demotiles.maplibre.org/style.json" // Free style for demo, replaced with env var if available
                    attributionControl={false}
                >
                    <NavigationControl position="top-right" />
                    <ScaleControl />
                    <GeolocateControl position="top-right" />

                    {issues.map((issue) => (
                        // Only render if we have valid coordinates
                        (issue.location.lat && issue.location.lng) && (
                            <Marker
                                key={issue.id}
                                longitude={issue.location.lng}
                                latitude={issue.location.lat}
                                anchor="bottom"
                                onClick={e => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedIssue(issue);
                                }}
                            >
                                <div className="group cursor-pointer">
                                    <div className="bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg transform transition-transform group-hover:scale-110 border-2 border-white">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="w-1 h-3 bg-gradient-to-t from-black/20 to-transparent mx-auto"></div>
                                </div>
                            </Marker>
                        )
                    ))}

                    {selectedIssue && (
                        <Popup
                            anchor="top"
                            longitude={selectedIssue.location.lng}
                            latitude={selectedIssue.location.lat}
                            onClose={() => setSelectedIssue(null)}
                            className="min-w-[300px]"
                        >
                            <div className="p-1">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h3 className="font-bold text-sm line-clamp-2">{selectedIssue.title}</h3>
                                    <Badge variant={selectedIssue.status === 'Resolved' ? 'default' : 'secondary'} className="text-[10px] px-1 h-5">
                                        {selectedIssue.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{selectedIssue.description}</p>
                                <Link href={`/issues/${selectedIssue.id}`} className="text-xs font-semibold text-primary hover:underline">
                                    View Details &rarr;
                                </Link>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>
        </Card>
    );
}
