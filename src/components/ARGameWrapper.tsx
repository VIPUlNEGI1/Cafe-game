"use client";

import { useEffect, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";

const ARGameWrapper = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWon, setHasWon] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  // Start screen recording
  const startRecording = (canvas: HTMLCanvasElement) => {
    const stream = canvas.captureStream();
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      recordedChunks.current = [];
    };

    recorder.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  useEffect(() => {
    const initAR = async () => {
      const mindarThree = new MindARThree({
        container: containerRef.current!,
        imageTargetSrc: "/assets/targets.mind", // Make sure this file exists
      });

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
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });

      const canvas = containerRef.current?.querySelector("canvas");
      if (canvas) startRecording(canvas);
    };

    if (typeof window !== "undefined") {
      initAR();
    }
  }, []);

  return (
    <div className="w-full h-screen relative bg-black">
      <div ref={containerRef} className="w-full h-full" />

      {hasWon && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">🎉 You Win!</h2>
          <p className="text-gray-700">Enjoy 20% off your next coffee ☕</p>
        </div>
      )}
{/* 
      {videoURL && (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-10">
          <a
            href={videoURL}
            download="coffee-hunt.webm"
            className="bg-blue-500 text-white px-40 py-2 rounded shadow-lg"
          >
            Download Recording
          </a>
        </div>
      )} */}
    </div>
  );
};

export default ARGameWrapper;
