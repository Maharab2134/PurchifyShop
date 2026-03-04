import { useEffect, useState } from 'react'
import WelcomeAnimation from './WelcomeAnimation'
import PageTransitionAnimation from './PageTransitionAnimation'
import { animationApi } from '@/api/animation'

export default function AnimationManager() {
  const [settings, setSettings] = useState<{
    welcomeAnimation: {
      isActive: boolean
      duration: number
      showConfetti: boolean
      backgroundColor: string
      circleColor: string
    }
    pageTransitionAnimation: {
      isActive: boolean
      duration: number
      backgroundColor: string
      circleColor: string
    }
  } | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeCompleted, setWelcomeCompleted] = useState(false)

  useEffect(() => {
    animationApi
      .get()
      .then((data) => {
        const animSettings = data.animationSettings
        if (animSettings) {
          setSettings({
            welcomeAnimation: animSettings.welcomeAnimation || {
              isActive: false,
              duration: 3000,
              showConfetti: true,
              backgroundColor: '#000000',
              circleColor: '#ffffff',
            },
            pageTransitionAnimation: animSettings.pageTransitionAnimation || {
              isActive: false,
              duration: 1000,
              backgroundColor: '#000000',
              circleColor: '#6366f1',
            },
          })

          // Show welcome only on first visit in this tab (not on refresh)
          const alreadyShown = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('welcome_animation_shown') === '1'
          if (animSettings.welcomeAnimation?.isActive && !alreadyShown) {
            setShowWelcome(true)
            setWelcomeCompleted(false)
          } else {
            // If welcome is not active, mark as completed so page transition can work
            setWelcomeCompleted(true)
          }
        } else {
          // Set default settings if no data
          setSettings({
            welcomeAnimation: {
              isActive: false,
              duration: 3000,
              showConfetti: true,
              backgroundColor: '#000000',
              circleColor: '#ffffff',
            },
            pageTransitionAnimation: {
              isActive: false,
              duration: 1000,
              backgroundColor: '#000000',
              circleColor: '#6366f1',
            },
          })
          setWelcomeCompleted(true)
        }
      })
      .catch((error) => {
        // Set default settings on error
        setSettings({
          welcomeAnimation: {
            isActive: false,
            duration: 3000,
            showConfetti: true,
            backgroundColor: '#000000',
            circleColor: '#ffffff',
          },
          pageTransitionAnimation: {
            isActive: false,
            duration: 1000,
            backgroundColor: '#000000',
            circleColor: '#6366f1',
          },
        })
        setWelcomeCompleted(true)
        console.error('Failed to load animation settings:', error)
      })
  }, [])

  const handleWelcomeComplete = () => {
    setShowWelcome(false)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('welcome_animation_shown', '1')
    }
    setWelcomeCompleted(true)
    window.dispatchEvent(new CustomEvent('welcome-animation-complete'))
  }

  if (!settings) return null

  // Only show page transition if welcome is not active or has completed
  const canShowPageTransition = welcomeCompleted && !showWelcome

  return (
    <>
      {/* Welcome Animation - Only on initial page load/refresh */}
      {showWelcome && settings.welcomeAnimation.isActive && (
        <WelcomeAnimation
          isActive={showWelcome}
          duration={settings.welcomeAnimation.duration}
          showConfetti={settings.welcomeAnimation.showConfetti}
          backgroundColor={settings.welcomeAnimation.backgroundColor}
          circleColor={settings.welcomeAnimation.circleColor || '#ffffff'}
          onComplete={handleWelcomeComplete}
        />
      )}
      {/* Page Transition Animation - Only after welcome completes, and only on route changes */}
      {canShowPageTransition && settings.pageTransitionAnimation.isActive && (
        <PageTransitionAnimation
          key={welcomeCompleted ? 'ready' : 'waiting'}
          isActive={settings.pageTransitionAnimation.isActive}
          duration={settings.pageTransitionAnimation.duration}
          backgroundColor={settings.pageTransitionAnimation.backgroundColor}
          circleColor={settings.pageTransitionAnimation.circleColor || '#6366f1'}
        />
      )}
    </>
  )
}
