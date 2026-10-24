import { useState, useEffect } from 'react';

export default function PlayerAvatar({
  name = '',
  photoUrl = null,
  size = 'md',
  teamColor = '#00e5ff',
  shape = 'rounded-full',
  className = '',
  showBorder = true,
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-24 h-24 text-3xl',
    '3xl': 'w-28 h-28 text-4xl',
  };

  const currentSizeClass = sizeMap[size] || sizeMap.md;

  // Compute initials (e.g., "Suvradip Ghosh" -> "SG")
  const getInitials = (str) => {
    if (!str) return '⚡';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div
      className={`relative ${currentSizeClass} ${shape} aspect-square overflow-hidden flex-shrink-0 flex items-center justify-center font-black select-none ${className}`}
      style={{
        backgroundColor: `${teamColor}15`,
        border: showBorder ? `2px solid ${teamColor}50` : 'none',
        boxShadow: showBorder ? `0 4px 14px ${teamColor}15` : 'none',
      }}
    >
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="tracking-wider uppercase"
          style={{ color: teamColor }}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

