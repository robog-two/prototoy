import { useEffect, useRef } from 'react'

interface EllipsisConfig {
  selector: string
  splitter?: string
  reverse?: boolean
}

export function useEllipsis() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateEllipsis = () => {
      const configs: EllipsisConfig[] = [
        { selector: '.tb-crumb' },
        { selector: '.preview-foot span', splitter: '/', reverse: true },
      ]

      configs.forEach(config => {
        const elements = container.querySelectorAll(config.selector)

        elements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement
          let originalText = htmlEl.getAttribute('data-original-text')

          if (!originalText) {
            originalText = htmlEl.textContent || ''
            htmlEl.setAttribute('data-original-text', originalText)
          }

          // Always start with original text
          htmlEl.textContent = originalText

          htmlEl.style.overflow = 'hidden'
          htmlEl.style.textOverflow = 'ellipsis'
          htmlEl.style.whiteSpace = 'nowrap'

          // Check if text overflows
          if (htmlEl.scrollWidth > htmlEl.clientWidth + 1) {
            htmlEl.setAttribute('title', originalText)
            htmlEl.classList.add('ellipsized')

            // Apply smart ellipsis if configured
            if (config.splitter && config.reverse) {
              const truncated = smartTruncate(originalText, htmlEl.clientWidth, config.splitter)
              htmlEl.textContent = truncated
            }
          } else {
            htmlEl.removeAttribute('title')
            htmlEl.classList.remove('ellipsized')
          }
        })
      })
    }

    function smartTruncate(text: string, maxWidth: number, splitter: string): string {
      const parts = text.split(splitter).filter(p => p)
      if (parts.length <= 1) return text

      const ELLIPSIS = '...'
      const tempEl = document.createElement('span')
      tempEl.style.position = 'absolute'
      tempEl.style.visibility = 'hidden'
      tempEl.style.whiteSpace = 'nowrap'
      document.body.appendChild(tempEl)

      let result = text

      // Try progressively shorter versions, keeping the end parts
      for (let keep = parts.length; keep >= 1; keep--) {
        const endParts = parts.slice(-keep)
        let candidate = endParts.join(splitter)

        if (keep < parts.length) {
          candidate = ELLIPSIS + splitter + candidate
        }

        tempEl.textContent = candidate
        if (tempEl.offsetWidth <= maxWidth) {
          result = candidate
          break
        }
      }

      document.body.removeChild(tempEl)
      return result
    }

    updateEllipsis()
    const resizeObserver = new ResizeObserver(updateEllipsis)
    resizeObserver.observe(container)
    window.addEventListener('resize', updateEllipsis)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateEllipsis)
    }
  }, [])

  return containerRef
}
