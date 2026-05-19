import { useEffect, useState } from 'react'

export function usePWAInstall() {
  const [showBanner, setShowBanner] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const isStandalone =
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches

  const isMobile =
    typeof window !== 'undefined' &&
    window.innerWidth < 1024 &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const isInstalled = localStorage.getItem('pwa_installed') === 'true'
  const dismissCount = parseInt(localStorage.getItem('pwa_dismissed_count') ?? '0', 10)
  const canShow = !isStandalone && !isInstalled && isMobile && dismissCount < 3

  useEffect(() => {
    if (!canShow) return

    // Vérifier si un rappel est planifié
    const remindDate = localStorage.getItem('pwa_remind_date')
    if (remindDate && Date.now() < parseInt(remindDate, 10)) return

    // Première connexion sur cet appareil
    const hasSeenGuide = localStorage.getItem('pwa_guide_shown')
    if (hasSeenGuide) return

    const t = setTimeout(() => {
      setShowBanner(true)
      localStorage.setItem('pwa_guide_shown', 'true')
    }, 3000)
    return () => clearTimeout(t)
  }, [canShow])

  function dismiss() {
    const next = dismissCount + 1
    localStorage.setItem('pwa_dismissed_count', String(next))
    setShowBanner(false)
    setShowGuide(false)
  }

  function openGuide() { setShowGuide(true) }
  function closeGuide() { setShowGuide(false) }

  function confirmInstalled() {
    localStorage.setItem('pwa_installed', 'true')
    setShowBanner(false)
    setShowGuide(false)
  }

  function remindLater() {
    const in3days = Date.now() + 3 * 24 * 60 * 60 * 1000
    localStorage.setItem('pwa_remind_date', String(in3days))
    setShowBanner(false)
    setShowGuide(false)
  }

  return {
    showBanner, setShowBanner,
    showGuide, openGuide, closeGuide,
    dismiss, confirmInstalled, remindLater,
    isStandalone, isMobile, canShow,
  }
}

// Détection OS
export function detectOS() {
  if (typeof navigator === 'undefined') return { isIOS: false, isAndroid: false, isSamsung: false, isSafari: false, isChrome: false, isDesktop: true }
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)
  const isSamsung = /SamsungBrowser/.test(ua)
  const isSafari = isIOS && /^((?!chrome|android).)*safari/i.test(ua)
  const isChrome = /Chrome/.test(ua) && !isSamsung
  const isDesktop = !isIOS && !isAndroid
  return { isIOS, isAndroid, isSamsung, isSafari, isChrome, isDesktop }
}
