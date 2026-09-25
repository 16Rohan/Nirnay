import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './MissionGallery.module.css'
import { MISSION_GALLERY_SLIDES, MissionSlide } from './missionGallerySlides'

interface MissionGalleryProps {
  slides?: MissionSlide[]
}

export default function MissionGallery({ slides = MISSION_GALLERY_SLIDES }: MissionGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const isTransitioningRef = useRef(false)

  // IntersectionObserver to lazy-load & trigger section entrance
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const nextSlide = useCallback(() => {
    if (isTransitioningRef.current) return
    if (currentIndex < slides.length - 1) {
      isTransitioningRef.current = true
      setCurrentIndex((prev) => prev + 1)
      setTimeout(() => {
        isTransitioningRef.current = false
      }, 700)
    }
  }, [currentIndex, slides.length])

  const prevSlide = useCallback(() => {
    if (isTransitioningRef.current) return
    if (currentIndex > 0) {
      isTransitioningRef.current = true
      setCurrentIndex((prev) => prev - 1)
      setTimeout(() => {
        isTransitioningRef.current = false
      }, 700)
    }
  }, [currentIndex])

  const goToSlide = (idx: number) => {
    if (isTransitioningRef.current || idx === currentIndex) return
    isTransitioningRef.current = true
    setCurrentIndex(idx)
    setTimeout(() => {
      isTransitioningRef.current = false
    }, 700)
  }

  // Touch Swipe Handlers (Horizontal)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartXRef.current - touchEndX

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }
    touchStartXRef.current = null
  }

  // Wheel Event Handler
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 25) return

    if (e.deltaY > 0 && currentIndex < slides.length - 1) {
      e.preventDefault()
      nextSlide()
    } else if (e.deltaY < 0 && currentIndex > 0) {
      e.preventDefault()
      prevSlide()
    }
  }

  const formattedCurrent = String(currentIndex + 1).padStart(2, '0')
  const formattedTotal = String(slides.length).padStart(2, '0')

  return (
    <section
      ref={sectionRef}
      className={styles.gallerySection}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Mission Gallery"
    >
      {/* Tactical HUD Corner Accents */}
      <span className={styles.hudCornerTL} />
      <span className={styles.hudCornerTR} />
      <span className={styles.hudCornerBL} />
      <span className={styles.hudCornerBR} />

      {/* Subtle Tactical Scanline */}
      <div className={styles.scanline} />

      <div className={styles.pinnedContainer}>
        {/* 3D Stage */}
        <div className={styles.stage}>
          {slides.map((slide, index) => {
            let slideClass = styles.slide
            if (index === currentIndex) {
              slideClass += ` ${styles.slideActive}`
            } else if (index < currentIndex) {
              slideClass += ` ${styles.slidePrev}`
            } else {
              slideClass += ` ${styles.slideNext}`
            }

            return (
              <div key={slide.id} className={slideClass} aria-hidden={index !== currentIndex}>
                <div className={styles.imageFrame}>
                  {isVisible && (
                    <img
                      src={slide.image}
                      alt={slide.caption}
                      className={styles.slideImage}
                      loading="lazy"
                    />
                  )}
                </div>

                <div className={styles.scrim} />

                {/* Caption (Bottom-Left) */}
                <div className={styles.captionBox}>
                  <div className={styles.titleTag}>
                    <span className={styles.titleTagDot} />
                    <span>MISSION THEATER // 0{index + 1}</span>
                  </div>
                  <h2 className={styles.captionTitle}>{slide.caption}</h2>
                  <p className={styles.captionSub}>{slide.subLabel}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Counter (Top-Right) */}
        <div className={styles.counter}>
          <span className={styles.counterActive}>{formattedCurrent}</span>
          <span className={styles.counterTotal}> / {formattedTotal}</span>
        </div>

        {/* Progress Indicator (Right Edge Stack) */}
        <div className={styles.progressNav} aria-label="Slide Selection">
          {slides.map((slide, index) => {
            const isActive = index === currentIndex
            return (
              <button
                key={`dot-${slide.id}`}
                className={`${styles.progressItem} ${isActive ? styles.progressItemActive : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}: ${slide.caption}`}
              >
                {index > 0 && <span className={styles.progressLine} />}
                <span className={styles.progressDot} />
              </button>
            )
          })}
        </div>

        {/* Manual Navigation Controls */}
        <div className={styles.controls}>
          <button
            className={styles.navBtn}
            onClick={prevSlide}
            disabled={currentIndex === 0}
            aria-label="Previous Slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className={styles.navBtn}
            onClick={nextSlide}
            disabled={currentIndex === slides.length - 1}
            aria-label="Next Slide"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  )
}
