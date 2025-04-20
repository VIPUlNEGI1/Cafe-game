// src/components/ARControls.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

// Define types for MindARThree (basic type for now)
interface MindARThreeType extends MindARThree {
  stop(): Promise<void>;
  start(): Promise<void>;
}

const ARGameWrapper = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWon, setHasWon] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isARInitialized, setIsARInitialized] = useState(false);
  const mindarThreeRef = useRef<MindARThreeType | null>(null);

  // Start screen recording
  const startRecording = (canvas: HTMLCanvasElement) => {
    if (isRecording || !canvas) return;
    const stream = canvas.captureStream();
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      recordedChunks.current = [];
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const shareRecording = () => {
    if (videoURL && navigator.share) {
      navigator.share({
        title: "My AR Coffee Hunt",
        url: videoURL,
      }).catch(() => alert("Sharing failed or not supported."));
    } else {
      alert("Sharing not supported on this device.");
    }
  };

  const toggleCamera = () => {
    setUseFrontCamera((prev) => !prev);
  };

  useEffect(() => {
    const initAR = async () => {
      if (!containerRef.current) return;

      // Stop and reinitialize if already running
      if (mindarThreeRef.current) {
        await mindarThreeRef.current.stop();
      }

      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: "/assets/targets.mind",
        videoSettings: {
          facingMode: useFrontCamera ? "user" : "environment",
        },
      }) as MindARThreeType;

      mindarThreeRef.current = mindarThree;

      const { renderer, scene, camera } = mindarThree;
      const anchor = mindarThree.addAnchor(0);

      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      scene.add(light);

      const loader = new GLTFLoader();
      loader.load("/assets/coffeeMug.glb", (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        anchor.group.add(model);
      });

      anchor.onTargetFound = () => {
        setHasWon(true);
        stopRecording();
      };

      await mindarThree.start();
      renderer.setAnimationLoop(() => renderer.render(scene, camera));

      const canvas = containerRef.current.querySelector("canvas");
      if (canvas && !isRecording) {
        startRecording(canvas);
      } else {
        console.warn("Canvas not found for recording");
      }

      setIsARInitialized(true);
    };

    if (typeof window !== "undefined") {
      initAR();
    }

    // Cleanup on unmount
    return () => {
      if (mindarThreeRef.current) {
        mindarThreeRef.current.stop();
      }
    };
  }, [useFrontCamera, isRecording]);

  return (
    <div className="w-full h-screen relative bg-black flex flex-col">
      <div ref={containerRef} className="w-full h-full flex-1" />

      {hasWon && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">🎉 You Win!</h2>
          <p className="text-gray-700">Enjoy 20% off your next coffee ☕</p>
        </div>
      )}

      {/* Control Bar */}
      <div className="w-full flex justify-center space-x-4 px-2 py-2 bg-gray-900 sm:px-4">
        <button
          onClick={() => {
            const canvas = containerRef.current?.querySelector("canvas");
            if (canvas && isARInitialized && !isRecording) startRecording(canvas);
          }}
          className="bg-green-500 text-white p-3 rounded-full shadow-md hover:bg-green-600 transition sm:p-4"
          disabled={isRecording || !isARInitialized}
        >
          🎬 Start
        </button>

        <button
          onClick={stopRecording}
          className="bg-red-500 text-white p-3 rounded-full shadow-md hover:bg-red-600 transition sm:p-4"
          disabled={!isRecording}
        >
          ⏹️ Stop
        </button>

        <button
          onClick={shareRecording}
          className="bg-blue-500 text-white p-3 rounded-full shadow-md hover:bg-blue-600 transition sm:p-4"
          disabled={!videoURL}
        >
          📤 Share
        </button>

        <button
          onClick={() => {
            if (videoURL) {
              const downloadLink = document.createElement("a");
              downloadLink.href = videoURL;
              downloadLink.download = "coffee-hunt.webm";
              downloadLink.click();
            }
          }}
          className="bg-purple-500 text-white p-3 rounded-full shadow-md hover:bg-purple-600 transition sm:p-4"
          disabled={!videoURL}
        >
          ⬇️ Download
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full shadow-md transition sm:p-4 ${
            useFrontCamera
              ? "bg-gray-500 text-white hover:bg-gray-600"
              : "bg-gray-800 text-white hover:bg-gray-900"
          }`}
        >
          {useFrontCamera ? "🔙 Back" : "🤳 Front"}
        </button>
      </div>
    </div>
  );
};

export default ARGameWrapper;