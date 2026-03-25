interface Props {
  size?: number
  className?: string
}

// Poste de barbería minimalista — franjas diagonales dentro de una cápsula
export default function Logo({ size = 28, className }: Props) {
  return (
    <svg
      width={Math.round(size * 0.5)}
      height={size}
      viewBox="0 0 10 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <clipPath id="fd-pole">
          <rect x="0.5" y="0.5" width="9" height="19" rx="4" />
        </clipPath>
      </defs>

      {/* Cuerpo del poste */}
      <rect x="0.5" y="0.5" width="9" height="19" rx="4"
        fill="#1e5fa8" fillOpacity="0.12"
        stroke="#1e5fa8" strokeOpacity="0.4" strokeWidth="1"
      />

      {/* Franjas diagonales */}
      <g clipPath="url(#fd-pole)">
        <rect x="-4" y="1"  width="18" height="4.5" rx="0" transform="rotate(-18 -4 1)"  fill="#c41e3a" fillOpacity="0.85" />
        <rect x="-4" y="8"  width="18" height="4.5" rx="0" transform="rotate(-18 -4 8)"  fill="#c41e3a" fillOpacity="0.85" />
        <rect x="-4" y="15" width="18" height="4.5" rx="0" transform="rotate(-18 -4 15)" fill="#c41e3a" fillOpacity="0.85" />
      </g>

      {/* Caps superior e inferior */}
      <rect x="0.5" y="0.5"  width="9" height="2.5" rx="4"
        fill="#1e5fa8" fillOpacity="0.35" clipPath="url(#fd-pole)" />
      <rect x="0.5" y="17" width="9" height="2.5" rx="0"
        fill="#1e5fa8" fillOpacity="0.35" clipPath="url(#fd-pole)" />
    </svg>
  )
}
