"use client";

import { useState, useRef, useCallback } from "react";

type RecordingState = "idle" | "recording" | "paused" | "stopped";

export function useRecording() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [timerDuration, setTimerDuration] = useState<number>(20); // minutes
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const alarmAudioContextRef = useRef<AudioContext | null>(null);
  const alarmOscillatorRef = useRef<OscillatorNode | null>(null);

  // Timer functions
  const playTimerAlarm = useCallback(() => {
    try {
      // Clean up any existing alarm audio context
      if (
        alarmAudioContextRef.current &&
        alarmAudioContextRef.current.state !== "closed"
      ) {
        alarmAudioContextRef.current.close();
      }
      if (alarmOscillatorRef.current) {
        alarmOscillatorRef.current.stop();
        alarmOscillatorRef.current.disconnect();
      }

      // Create a new audio context for the alarm
      const audioContext = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
      alarmAudioContextRef.current = audioContext;

      const oscillator = audioContext.createOscillator();
      alarmOscillatorRef.current = oscillator;
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz tone
      oscillator.type = "sine";

      // Create a beep pattern: 3 short beeps
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.7);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.9);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 1.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.2);

      // Clean up after the alarm finishes
      setTimeout(() => {
        if (
          alarmAudioContextRef.current &&
          alarmAudioContextRef.current.state !== "closed"
        ) {
          alarmAudioContextRef.current.close();
        }
        alarmOscillatorRef.current = null;
      }, 1500);
    } catch (error) {
      console.error("Failed to play timer alarm:", error);
    }
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmOscillatorRef.current) {
      try {
        alarmOscillatorRef.current.stop();
        alarmOscillatorRef.current.disconnect();
        alarmOscillatorRef.current = null;
      } catch (error) {
        console.error("Error stopping alarm oscillator:", error);
      }
    }
    if (
      alarmAudioContextRef.current &&
      alarmAudioContextRef.current.state !== "closed"
    ) {
      try {
        alarmAudioContextRef.current.close();
        alarmAudioContextRef.current = null;
      } catch (error) {
        console.error("Error closing alarm audio context:", error);
      }
    }
  }, []);

  const startTimer = useCallback(() => {
    setTimeRemaining(timerDuration * 60);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer finished - show alarm and stop timer
          setRecordingState("paused");
          playTimerAlarm();
          // Clear the timer interval to prevent it from continuing
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerDuration, playTimerAlarm]);

  const resumeTimer = useCallback(() => {
    // Only resume if there's time remaining
    if (timeRemaining <= 0) return;

    // Resume timer without resetting the time remaining
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer finished - show alarm and stop timer
          setRecordingState("paused");
          playTimerAlarm();
          // Clear the timer interval to prevent it from continuing
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timeRemaining, playTimerAlarm]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Stop any playing alarm
    stopAlarm();
  }, [stopAlarm]);

  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream?: MediaStream) => {
    const streamToUse = stream || streamRef.current;
    if (!streamToUse) return;

    try {
      // Clean up existing audio context if it exists and is not closed
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }

      audioContextRef.current = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();

      const source =
        audioContextRef.current.createMediaStreamSource(streamToUse);
      analyserRef.current = audioContextRef.current.createAnalyser();

      // Configuration for time domain analysis
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          // Use time domain data for better volume detection
          analyserRef.current.getByteTimeDomainData(dataArray);

          // Calculate RMS (Root Mean Square) for accurate volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const value = (dataArray[i] - 128) / 128.0; // normalize [-1, 1]
            sum += value * value;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const volume = Math.min(1, rms * 10); // increased amplification

          setAudioLevel(volume);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (error) {
      console.error("Audio level monitoring error:", error);
    }
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Recording functions
  const startRecording = useCallback(
    async (selectedDevice: string) => {
      try {
        setError("");
        const constraints = {
          audio:
            selectedDevice && selectedDevice !== "default"
              ? { deviceId: { exact: selectedDevice } }
              : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        setAudioChunks([]);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            setAudioChunks([...audioChunksRef.current]);
          }
        };

        mediaRecorder.start();
        setRecordingState("recording");
        startTimer();
        startAudioLevelMonitoring();
      } catch (error) {
        setError(
          "Failed to start recording. Please check microphone permissions."
        );
        console.error("Recording error:", error);
      }
    },
    [startTimer, startAudioLevelMonitoring]
  );

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      recordingState === "recording" &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      stopTimer();
      stopAudioLevelMonitoring();
    }
  }, [recordingState, stopTimer, stopAudioLevelMonitoring]);

  const resumeRecording = useCallback(() => {
    console.log("Resume clicked - recordingState:", recordingState);
    console.log("MediaRecorder state:", mediaRecorderRef.current?.state);

    if (
      mediaRecorderRef.current &&
      recordingState === "paused" &&
      mediaRecorderRef.current.state === "paused"
    ) {
      console.log("Resuming recording...");
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      resumeTimer();
      startAudioLevelMonitoring();
    } else if (mediaRecorderRef.current?.state === "inactive") {
      // If MediaRecorder is inactive, we need to restart recording
      console.warn("MediaRecorder was inactive, restarting recording...");
      // Note: This would need the selectedDevice parameter
    } else {
      // Debug: Show why resume didn't work
      console.warn("Resume conditions not met:", {
        hasMediaRecorder: !!mediaRecorderRef.current,
        recordingState: recordingState,
        mediaRecorderState: mediaRecorderRef.current?.state,
      });

      // Fallback: try to resume anyway if we have a MediaRecorder and local state is paused
      if (mediaRecorderRef.current && recordingState === "paused") {
        console.log("Attempting fallback resume...");
        try {
          mediaRecorderRef.current.resume();
          setRecordingState("recording");
          resumeTimer();
          startAudioLevelMonitoring();
        } catch (error) {
          console.error("Fallback resume failed:", error);
          // If resume fails, restart recording
          // Note: This would need the selectedDevice parameter
        }
      }
    }
  }, [recordingState, resumeTimer, startAudioLevelMonitoring]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
      stopTimer();
      stopAudioLevelMonitoring();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  }, [stopTimer, stopAudioLevelMonitoring]);

  const clearAudioChunks = useCallback(() => {
    audioChunksRef.current = [];
    setAudioChunks([]);
  }, []);

  // Test audio function
  const testAudio = useCallback(
    async (selectedDevice: string) => {
      try {
        setError("");
        const constraints = {
          audio:
            selectedDevice && selectedDevice !== "default"
              ? { deviceId: { exact: selectedDevice } }
              : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Start audio level monitoring with the test stream
        startAudioLevelMonitoring(stream);

        // Stop testing after 10 seconds
        setTimeout(() => {
          stopAudioLevelMonitoring();
          stream.getTracks().forEach((track) => track.stop());
        }, 10000);

        return stream;
      } catch (error) {
        setError("Failed to test microphone. Please check your microphone.");
        console.error("Audio test error:", error);
        throw error;
      }
    },
    [startAudioLevelMonitoring, stopAudioLevelMonitoring]
  );

  // Cleanup
  const cleanup = useCallback(() => {
    stopTimer();
    stopAudioLevelMonitoring();
    stopAlarm();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, [stopTimer, stopAudioLevelMonitoring, stopAlarm]);

  return {
    // State
    recordingState,
    timerDuration,
    timeRemaining,
    audioLevel,
    error,
    audioChunks,

    // Actions
    setTimerDuration,
    setError,
    setAudioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearAudioChunks,
    testAudio,
    cleanup,
  };
}
