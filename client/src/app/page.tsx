'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as handpose from '@tensorflow-models/handpose'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastY = useRef<number | null>(null)
  const [model, setModel] = useState<handpose.HandPose | null>(null)

  // Scroll debounce lock - to avoid multiple scrolls firing rapidly
  const scrollLock = useRef(false)

  useEffect(() => {
    const setupCamera = async () => {
      const video = videoRef.current
      if (!video) return

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      video.srcObject = stream
      await video.play()
    }

    const loadModel = async () => {
      await tf.setBackend('webgl')
      const handposeModel = await handpose.load()
      setModel(handposeModel)
    }

    setupCamera()
    loadModel()
  }, [])

  useEffect(() => {
    if (!model) return

    let animationFrameId: number

    const runDetection = async () => {
      const video = videoRef.current
      if (!video) return

      const predictions = await model.estimateHands(video)
      if (predictions.length > 0) {
        const tip = predictions[0].annotations.indexFinger[3] // fingertip [x, y, z]

        const currentY = tip[1]

        if (lastY.current !== null) {
          const diff = currentY - lastY.current

          // Threshold to avoid tiny accidental movements triggering scroll
          const threshold = 15 

          if (!scrollLock.current) {
            if (diff > threshold) {
              // Finger moved down -> scroll down one screen
              window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
              scrollLock.current = true
              setTimeout(() => (scrollLock.current = false), 800)
            } else if (diff < -threshold) {
              // Finger moved up -> scroll up one screen
              window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })
              scrollLock.current = true
              setTimeout(() => (scrollLock.current = false), 800)
            }
          }
        }
        lastY.current = currentY
      }
      animationFrameId = requestAnimationFrame(runDetection)
    }
    runDetection()

    return () => cancelAnimationFrame(animationFrameId)
  }, [model])

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="fixed top-0 left-0 w-full h-full object-cover opacity-30 z-0"
        playsInline
        muted
      />
      <div className="fixed bottom-4 left-4 text-white text-lg font-bold z-10 bg-black bg-opacity-50 p-2 rounded-md">
        ✋ Move your index finger up/down to scroll
      </div>

      <div className="relative z-10">
        {[1, 2, 3, 4, 5].map((num) => (
          <section
            key={num}
            className={`h-screen flex items-center justify-center text-6xl font-bold select-none ${
              num % 2 === 0 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            Screen {num}
          </section>
        ))}
      </div>
    </div>
  )
}
