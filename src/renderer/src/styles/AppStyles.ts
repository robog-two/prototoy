import styled from '@emotion/styled'

/* LogPanel Styles */
export const LogPanelBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  padding: 16px;
`

export const LogPanelContainer = styled.div`
  width: 100%;
  max-height: 60vh;
  background: #1a1a1a;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

export const LogPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
`

export const LogPanelTitle = styled.span`
  font-family: var(--font-mono);
  font-size: 12px;
  color: #aaa;
`

export const LogPanelCloseBtn = styled.button`
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 2px;
`

export const LogPanelContent = styled.div`
  overflow-y: auto;
  padding: 10px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  flex: 1;
`

export const LogLine = styled.div<{ color: string }>`
  color: ${(props) => props.color};
  white-space: pre-wrap;
  word-break: break-all;
`

/* PanelError Styles */
export const PanelErrorContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-paper);
  padding: var(--sp-8);
`

export const PanelErrorBox = styled.div`
  max-width: 400px;
  background: var(--color-paper);
  border: 2px solid var(--color-ink);
  padding: var(--sp-7);
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  box-shadow: var(--shadow-hard);
`

export const PanelErrorTitle = styled.div`
  font-weight: bold;
  font-size: var(--fs-lg);
  display: flex;
  align-items: center;
  gap: var(--sp-3);
`

export const PanelErrorMessage = styled.p`
  font-family: var(--font-text);
  font-size: var(--fs-sm);
  color: var(--color-ink-80);
  margin: 0;
`

/* Toast Styles */
export const ToastContainer = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-paper);
  border: 1.5px solid var(--color-ink);
  padding: 12px 16px;
  font-size: var(--fs-sm);
  color: var(--color-ink);
  pointer-events: none;
  z-index: 9999;
  box-shadow: var(--shadow-hard);
  animation: slideUp 0.2s ease;

  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
`

/* UpdatingOverlay Styles */
export const UpdatingOverlayBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
`

export const UpdatingOverlayBox = styled.div`
  background: var(--color-paper);
  border: 1px solid var(--color-paper-3);
  border-radius: 8px;
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  width: 240px;
  box-shadow: var(--shadow-hard);
`

export const UpdatingOverlayTitle = styled.div`
  font-size: var(--fs-sm);
  font-weight: bold;
  color: var(--color-ink);
  text-align: center;
`

export const UpdatingOverlayProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: var(--color-paper-3);
  border-radius: 2px;
  overflow: hidden;
`

export const UpdatingOverlayProgressFill = styled.div<{ percent: number }>`
  height: 100%;
  background: var(--color-cyan);
  border-radius: 2px;
  width: ${(props) => props.percent}%;
  transition: width 0.3s ease;
`

export const UpdatingOverlayPercent = styled.div`
  font-size: var(--fs-xs);
  color: var(--color-ink-60);
  text-align: center;
`

/* CorruptProjectDialog Styles */
export const CorruptProjectDialogBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(13, 7, 72, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

export const CorruptProjectDialogContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
`

export const ErrorPathBox = styled.div`
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--color-ink-60);
  padding: 5px 8px;
  background: var(--color-paper-2);
  border: 1px solid var(--color-paper-3);
  overflow-wrap: break-word;
  word-break: break-all;
`

export const ErrorNote = styled.p`
  font-family: var(--font-text);
  font-size: var(--fs-xs);
  color: var(--color-ink-60);
  font-style: italic;
  margin: 0;
`
