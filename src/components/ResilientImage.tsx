import React, { useEffect, useState } from 'react';
import { Coffee } from 'lucide-react';
import { IMAGE_MAP } from '../data/catalog';
import type { ImageKey } from '../types/coffee';

interface ResilientImageProps {
  imageKey: ImageKey;
  customSrc?: string;
  alt: string;
  className?: string;
  label?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  imageKey,
  customSrc,
  alt,
  className = '',
  label,
}) => {
  const [hasError, setHasError] = useState(false);
  const src = (customSrc && customSrc.trim()) || IMAGE_MAP[imageKey] || IMAGE_MAP.latte;

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EBE6DC] text-[#4E4842] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Coffee className="w-8 h-8 mb-2 text-[#1B3B2B] opacity-75" />
        <span className="text-xs font-medium tracking-wide text-[#4E4842]">
          {label || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
