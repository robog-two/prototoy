import styled from '@emotion/styled'

export const BackButton = styled.button`
  margin-right: var(--sp-4);
`

export const SectionLabel = styled.span`
  color: var(--color-ink-60);
`

export const StageContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`

export const PhoneScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`

export const PhoneScreenInner = styled.div`
  cursor: none;
`

export const PhoneStatusBar = styled.div`
  z-index: 10;
`

export const CursorIndicator = styled.div<{
  x: number
  y: number
  clicking: boolean
}>`
  position: absolute;
  left: ${(props) => props.x}px;
  top: ${(props) => props.y}px;
  width: ${(props) => (props.clicking ? 12 : 20)}px;
  height: ${(props) => (props.clicking ? 12 : 20)}px;
  transform: translate(-50%, -50%);
  background: rgba(160, 160, 160, 0.35);
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  pointer-events: none;
  z-index: 20;
  transition:
    width 0.08s ease,
    height 0.08s ease;
  backdrop-filter: blur(1px);
`

export const PreviewFooterFlex = styled.div`
  flex: 1;
`

export const PreviewFooterPath = styled.span`
  font-family: var(--font-mono);
`

export const LoadingOverlayContainer = styled.div`
  width: 292px;
  height: 552px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--color-paper);
  color: var(--color-ink-60);
  font-family: var(--font-text);
  font-size: 13px;
`

export const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-paper-3);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

export const EmptyStateContainer = styled.div`
  width: 292px;
  height: 552px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-paper);
  color: var(--color-ink-60);
  font-family: var(--font-text);
  font-size: 13px;
`
