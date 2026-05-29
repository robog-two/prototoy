import React from 'react'

export const Folder = ({ open = false }: { open?: boolean }): React.ReactElement => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    {open ? (
      <>
        <path
          d="M1.5 3.5 L1.5 12.5 L13.5 12.5 L14.5 6 L4 6 L3 4 L1.5 3.5 Z"
          fill="var(--color-paper)"
        />
        <path d="M3 6 L4 4 L14 4 L14 5" />
      </>
    ) : (
      <>
        <path d="M1.5 4 L6 4 L7.5 5.5 L14.5 5.5 L14.5 12.5 L1.5 12.5 Z" fill="var(--color-paper)" />
      </>
    )}
  </svg>
)

export const Screen = (): React.ReactElement => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="2" width="8" height="12" />
    <line x1="6.5" y1="13" x2="9.5" y2="13" />
  </svg>
)

export const Chevron = (): React.ReactElement => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,3 11,8 6,13" />
  </svg>
)

export const Plus = (): React.ReactElement => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="6" y1="2" x2="6" y2="10" />
    <line x1="2" y1="6" x2="10" y2="6" />
  </svg>
)

export const Claude = (): React.ReactElement => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="3,4 6,7 3,10" />
    <line x1="7.5" y1="10.5" x2="11.5" y2="10.5" />
  </svg>
)

export const Camera = (): React.ReactElement => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 5.5 L4.5 5.5 L5.5 3.5 L10.5 3.5 L11.5 5.5 L14 5.5 L14 12 L2 12 Z" />
    <circle cx="8" cy="8.2" r="2.2" />
  </svg>
)

export const VideoCamera = ({ recording = false }: { recording?: boolean }): React.ReactElement => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4.5" width="9" height="7" />
    <path d="M11 7 L14 5 L14 11 L11 9 Z" fill="currentColor" stroke="none" />
    <circle
      cx="5"
      cy="8"
      r="0.75"
      fill={recording ? '#ef4444' : 'currentColor'}
      stroke="none"
      style={recording ? { animation: 'tbVideoRecBlink 1s step-start infinite' } : {}}
    />
  </svg>
)

export const Reload = (): React.ReactElement => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 8 a5 5 0 1 0 1.5 -3.5" />
    <polyline points="2,2 2.5,5 5.5,4.5" />
  </svg>
)

export const Search = (): React.ReactElement => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="6" cy="6" r="3.5" />
    <line x1="9" y1="9" x2="12" y2="12" />
  </svg>
)

export const File = (): React.ReactElement => (
  <svg viewBox="0 0 33.982979 33.982979" style={{ fill: 'currentColor', stroke: 'none' }}>
    <path d="m 5.074387 0.024824 v 33.93333 h 23.834204 L 28.888591 6.868285 20.410039 0.024824 Z m 3.355351 3.355351 h 9.060945 v 8.353495 l 8.046538 -0.0062 0.01189 18.875334 H 8.429435 Z" />
  </svg>
)
