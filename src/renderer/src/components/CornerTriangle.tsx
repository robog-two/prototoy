import React from 'react'

interface Props {
  position: 'tl' | 'tr' | 'bl' | 'br'
  color: string
}

export default function CornerTriangle({ position, color }: Props): React.ReactElement {
  const paths = {
    tl: 'M0,0 L170,0 L0,170 Z',
    tr: 'M170,0 L170,170 L0,0 Z',
    bl: 'M0,170 L0,0 L170,170 Z',
    br: 'M170,170 L0,170 L170,0 Z',
  }

  return (
    <div className={`corner ${position}`}>
      <svg viewBox="0 0 170 170">
        <path d={paths[position]} fill={color} />
      </svg>
    </div>
  )
}
