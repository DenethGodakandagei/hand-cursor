'use client'
import { useEffect, useRef } from "react";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import '@tensorflow/tfjs-backend-webgl';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    };

    const runHandTracking = async () => {
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detector = await handPoseDetection.createDetector(model, {
        runtime: 'tfjs',
        modelType: 'lite',
      });

      const detect = async () => {
        if (videoRef.current) {
          const hands = await detector.estimateHands(videoRef.current);
          if (hands.length > 0) {
            const keypoints = hands[0].keypoints;
            const indexTip = keypoints.find((k) => k.name === "index_finger_tip");

            if (indexTip && cursorRef.current) {
              cursorRef.current.style.left = `${indexTip.x}px`;
              cursorRef.current.style.top = `${indexTip.y}px`;
            }
          }
        }
        requestAnimationFrame(detect);
      };
      detect();
    };

    setupCamera();
    runHandTracking();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <video ref={videoRef} className="absolute w-full h-full object-cover opacity-50" />
      <div
        ref={cursorRef}
        className="absolute w-6 h-6 bg-red-500 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
      ></div>
      <div className="absolute top-4 left-4 text-white text-xl font-bold">Hand-Controlled Cursor</div>
    </div>
  );
}
