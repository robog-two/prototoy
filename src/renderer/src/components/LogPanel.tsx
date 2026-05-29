import React, { useEffect } from 'react'
import {
  LogPanelBackdrop as StyledLogPanelBackdrop,
  LogPanelContainer as StyledLogPanelContainer,
  LogPanelHeader as StyledLogPanelHeader,
  LogPanelTitle as StyledLogPanelTitle,
  LogPanelCloseBtn as StyledLogPanelCloseBtn,
  LogPanelContent as StyledLogPanelContent,
  LogLine as StyledLogLine,
} from '../styles/AppStyles'

interface LogPanelProps {
  logs: string[]
  onClose: () => void
}

export default function LogPanel({ logs, onClose }: LogPanelProps): React.ReactElement {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <StyledLogPanelBackdrop onClick={onClose}>
      <StyledLogPanelContainer onClick={(e) => e.stopPropagation()}>
        <StyledLogPanelHeader>
          <StyledLogPanelTitle>Vite preview logs</StyledLogPanelTitle>
          <StyledLogPanelCloseBtn onClick={onClose}>×</StyledLogPanelCloseBtn>
        </StyledLogPanelHeader>
        <StyledLogPanelContent>
          {logs.length === 0 ? (
            <span style={{ color: '#555' }}>No logs yet.</span>
          ) : (
            logs.map((line, i) => {
              const isError = /error|failed|cannot/i.test(line)
              const isWarn = /warn/i.test(line)
              const color = isError ? '#f87171' : isWarn ? '#fbbf24' : '#d4d4d4'
              return (
                <StyledLogLine key={i} color={color}>
                  {line}
                </StyledLogLine>
              )
            })
          )}
          <div ref={bottomRef} />
        </StyledLogPanelContent>
      </StyledLogPanelContainer>
    </StyledLogPanelBackdrop>
  )
}
