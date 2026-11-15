import React, { useCallback, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { Clock, Compass, ExternalLink, MapPin, Store } from 'lucide-react';
import { SHOP_DETAILS } from '../data/catalog';

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

const RoasteryMarkerContent: React.FC<{ resetTrigger: number }> = ({ resetTrigger }) => {
  const map = useMap();
  const status = useApiLoadingStatus();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);

  React.useEffect(() => {
    if (map && resetTrigger > 0) {
      map.panTo(SHOP_DETAILS.coordinates);
      map.setZoom(15);
      setInfoOpen(true);
    }
  }, [map, resetTrigger]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return null;
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={SHOP_DETAILS.coordinates}
        onClick={() => setInfoOpen((prev) => !prev)}
        title={SHOP_DETAILS.name}
      >
        <Pin
          background="#1B3B2B"
          borderColor="#142D20"
          glyphColor="#FAF9F6"
          scale={1.2}
        />
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={260}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-1 text-[#181615] font-sans">
            <div className="flex items-center gap-2 mb-1">
              <img
                src={SHOP_DETAILS.logoUrl}
                alt="Mang Kape logo"
                referrerPolicy="no-referrer"
                className="w-7 h-7 object-contain rounded-full bg-white shrink-0"
              />
              <p className="font-display text-sm font-semibold">{SHOP_DETAILS.name}</p>
            </div>
            <p className="text-xs text-[#4E4842] mb-1.5">{SHOP_DETAILS.addressLine}</p>
            <p className="text-[11px] text-[#6B645C] mb-2">{SHOP_DETAILS.hoursDaily}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${SHOP_DETAILS.coordinates.lat},${SHOP_DETAILS.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B3B2B] underline"
            >
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const MapStatusFallback: React.FC = () => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F3F1EC] p-6 text-center">
        <MapPin className="w-8 h-8 text-[#1B3B2B] mb-2" />
        <p className="text-sm font-semibold text-[#181615] mb-1">{SHOP_DETAILS.name}</p>
        <p className="text-xs text-[#4E4842] mb-4">{SHOP_DETAILS.addressLine}</p>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${SHOP_DETAILS.coordinates.lat},${SHOP_DETAILS.coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1B3B2B] rounded-lg"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }
  return null;
};

export const LocationSection: React.FC = () => {
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleRecenter = useCallback(() => {
    setResetTrigger((c) => c + 1);
  }, []);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${SHOP_DETAILS.coordinates.lat},${SHOP_DETAILS.coordinates.lng}`;

  return (
    <section id="location" className="py-14 lg:py-20 border-b border-[#E6E2D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-medium text-[#4E4842] mb-2">Coffee Shop &amp; Tasting Bar</p>
          <h2
            className="font-display text-3xl sm:text-4xl font-semibold text-[#181615] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Visit us in Roxas City, Capiz
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Interactive Google Map Container */}
          <div className="lg:col-span-7 relative h-[420px] sm:h-[460px] rounded-xl overflow-hidden border border-[#E6E2D8] bg-[#F3F1EC]">
            {MAPS_API_KEY ? (
              <APIProvider apiKey={MAPS_API_KEY} language="en" region="PH" libraries={['marker']}>
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  defaultCenter={SHOP_DETAILS.coordinates}
                  defaultZoom={15}
                  gestureHandling="cooperative"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  <RoasteryMarkerContent resetTrigger={resetTrigger} />
                </GoogleMap>
                <MapStatusFallback />
              </APIProvider>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="w-8 h-8 text-[#1B3B2B] mb-2" />
                <p className="text-sm font-semibold text-[#181615] mb-1">{SHOP_DETAILS.name}</p>
                <p className="text-xs text-[#4E4842] mb-4">{SHOP_DETAILS.addressLine}</p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1B3B2B] rounded-lg"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Storefront Location & Transit Details */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E6E2D8] p-7 sm:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#6B645C] mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1B3B2B]" />
                  <span>Address</span>
                </div>
                <p className="text-base font-semibold text-[#181615]">{SHOP_DETAILS.addressLine}</p>
                <p className="text-sm text-[#4E4842] mt-0.5">{SHOP_DETAILS.neighborhood}</p>
                <p className="text-xs font-mono-tabular text-[#6B645C] mt-1">
                  {SHOP_DETAILS.coordinates.lat.toFixed(4)}° N, {Math.abs(SHOP_DETAILS.coordinates.lng).toFixed(4)}° {SHOP_DETAILS.coordinates.lng >= 0 ? 'E' : 'W'}
                </p>
              </div>

              <div className="pt-5 border-t border-[#EFECE4]">
                <div className="flex items-center gap-2 text-xs text-[#6B645C] mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1B3B2B]" />
                  <span>Hours</span>
                </div>
                <p className="text-sm text-[#181615] font-mono-tabular">{SHOP_DETAILS.hoursDaily}</p>
              </div>

              <div className="pt-5 border-t border-[#EFECE4]">
                <div className="flex items-center gap-2 text-xs text-[#6B645C] mb-1.5">
                  <Store className="w-3.5 h-3.5 text-[#1B3B2B]" />
                  <span>Mang Kape Shop Pickup</span>
                </div>
                <p className="text-sm text-[#181615]">{SHOP_DETAILS.email}</p>
                <p className="text-xs text-[#4E4842] mt-1.5 leading-relaxed">
                  Pickup available exclusively at Mang Kape Shop in Roxas City, Capiz.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#EFECE4] flex flex-wrap gap-3">
              {MAPS_API_KEY && (
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-medium text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded-lg transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-[#1B3B2B]" />
                  <span>Center Map</span>
                </button>
              )}

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-[#1B3B2B] hover:bg-[#142D20] rounded-lg transition-colors"
              >
                <span>Open Directions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
