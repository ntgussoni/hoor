"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Mic, Pause, Play, Square, Timer, Volume2 } from "lucide-react";

type RecordingState = "idle" | "recording" | "paused" | "stopped";
type TranscriptionState = "idle" | "processing" | "completed" | "error";

interface AudioDevice {
  deviceId: string;
  label: string;
}

export default function Home() {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcriptionState, setTranscriptionState] =
    useState<TranscriptionState>("idle");
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [timerDuration, setTimerDuration] = useState<number>(20); // minutes
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [language, setLanguage] = useState<string>("nl"); // Dutch default
  const [transcription, setTranscription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [testingAudio, setTestingAudio] = useState<boolean>(false);
  const [microphoneConnected, setMicrophoneConnected] =
    useState<boolean>(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio devices
  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        // First request microphone permissions
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Then enumerate devices (now with proper labels)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices
          .filter((device) => device.kind === "audioinput" && device.deviceId)
          .map((device, index) => ({
            deviceId: device.deviceId || `default-${index}`,
            label: device.label || `Microphone ${index + 1}`,
          }));

        setAudioDevices(audioInputs);
        setPermissionGranted(true);
        if (audioInputs.length > 0) {
          setSelectedDevice(audioInputs[0].deviceId);
        } else {
          // Fallback if no devices found
          setAudioDevices([
            { deviceId: "default", label: "Default Microphone" },
          ]);
          setSelectedDevice("default");
        }
      } catch (error) {
        setError(
          "Microphone permission denied. Please click 'Request Microphone Access' below."
        );
        console.error("Audio device error:", error);
        setPermissionGranted(false);
        // Still provide a fallback option
        setAudioDevices([{ deviceId: "default", label: "Default Microphone" }]);
        setSelectedDevice("default");
      }
    };

    getAudioDevices();
  }, []);

  // Audio level monitoring
  const startAudioLevelMonitoring = () => {
    if (!streamRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(
        streamRef.current
      );
      analyserRef.current = audioContextRef.current.createAnalyser();

      // Configuration for time domain analysis
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (
          analyserRef.current &&
          (recordingState === "recording" || recordingState === "paused")
        ) {
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
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Timer functions
  const startTimer = () => {
    setTimeRemaining(timerDuration * 60);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer finished - show alarm
          setRecordingState("paused");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Recording functions
  const startRecording = async () => {
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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
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
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      stopTimer();
      stopAudioLevelMonitoring();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      startTimer();
      startAudioLevelMonitoring();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
      stopTimer();
      stopAudioLevelMonitoring();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const transcribeAudio = async () => {
    if (audioChunksRef.current.length === 0) return;

    setTranscriptionState("processing");
    setError("");

    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      // Step 1: Get signed upload URL from backend
      const uploadUrlResponse = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: "recording.webm",
          contentType: "audio/webm",
        }),
      });

      const uploadUrlResult = await uploadUrlResponse.json();

      if (!uploadUrlResult.success) {
        throw new Error(uploadUrlResult.error || "Failed to get upload URL");
      }

      // Step 2: Upload audio directly to R2 using signed URL
      const uploadResponse = await fetch(uploadUrlResult.signedUrl, {
        method: "PUT",
        body: audioBlob,
        headers: {
          "Content-Type": "audio/webm",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload audio to storage");
      }

      // Step 3: Call transcription API with the key
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: uploadUrlResult.key,
          language: language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Transcription failed");
      }

      setTranscription(result.transcription);
      setTranscriptionState("completed");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to transcribe audio"
      );
      setTranscriptionState("error");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      // You could add a toast notification here
    } catch (error) {
      setError("Failed to copy to clipboard");
      console.error("Clipboard error:", error);
    }
  };

  const exportAsText = () => {
    const blob = new Blob([transcription], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultation-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const requestMicrophonePermission = async () => {
    try {
      setError("");
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Re-enumerate devices with proper labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((device) => device.kind === "audioinput" && device.deviceId)
        .map((device, index) => ({
          deviceId: device.deviceId || `default-${index}`,
          label: device.label || `Microphone ${index + 1}`,
        }));

      setAudioDevices(audioInputs);
      setPermissionGranted(true);
      if (audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      setError(
        "Failed to access microphone. Please check your browser permissions."
      );
      console.error("Permission request error:", error);
    }
  };

  const testAudioLevel = async () => {
    try {
      setError("");
      setTestingAudio(true);
      setAudioLevel(0);

      const constraints = {
        audio:
          selectedDevice && selectedDevice !== "default"
            ? { deviceId: { exact: selectedDevice } }
            : true,
      };

      console.log("Requesting audio with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Got audio stream:", stream);
      streamRef.current = stream;
      setMicrophoneConnected(true);

      // Audio level detection using time domain analysis
      const audioContext = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      // Configuration for time domain analysis
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      console.log("Buffer length:", bufferLength);

      const updateAudioLevel = () => {
        if (testingAudio) {
          // Use time domain data for better volume detection
          analyser.getByteTimeDomainData(dataArray);

          // Calculate RMS (Root Mean Square) for accurate volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const value = (dataArray[i] - 128) / 128.0; // normalize [-1, 1]
            sum += value * value;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const volume = Math.min(1, rms * 10); // increased amplification

          console.log(
            "Raw values:",
            dataArray.slice(0, 10),
            "RMS:",
            rms,
            "Volume:",
            volume
          );
          setAudioLevel(volume);

          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();

      // Store references for cleanup
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Stop testing after 10 seconds
      setTimeout(() => {
        stopAudioTest();
      }, 10000);
    } catch (error) {
      setError("Failed to test microphone. Please check your microphone.");
      console.error("Audio test error:", error);
      setTestingAudio(false);
    }
  };

  const stopAudioTest = () => {
    setTestingAudio(false);
    setMicrophoneConnected(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setAudioLevel(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Hoor</h1>
          <p className="text-lg text-gray-600">
            Veterinary Consultation Recording & Transcription
          </p>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!permissionGranted && (
          <div className="text-center mb-6">
            <Button onClick={requestMicrophonePermission} size="lg">
              <Mic className="h-4 w-4 mr-2" />
              Request Microphone Access
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Click to allow microphone access and see available devices
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recording Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Recording Controls
              </CardTitle>
              <CardDescription>
                Configure and control your consultation recording
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio Device Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Audio Input
                </label>
                <Select
                  value={selectedDevice}
                  onValueChange={setSelectedDevice}
                  disabled={!permissionGranted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timer Setting */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Recording Timer
                </label>
                <Select
                  value={timerDuration.toString()}
                  onValueChange={(value) => setTimerDuration(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Language
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nl">Dutch (Nederlands)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">German (Deutsch)</SelectItem>
                    <SelectItem value="fr">French (Français)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Level Visualization */}
              {(recordingState === "recording" || testingAudio) && (
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Audio Level {testingAudio && "(Testing)"}
                  </label>
                  <div className="space-y-2">
                    <Progress value={audioLevel * 100} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Silent</span>
                      <span className="font-medium">
                        {Math.round(audioLevel * 100)}%
                      </span>
                      <span>Loud</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Audio Button */}
              {permissionGranted &&
                recordingState === "idle" &&
                !testingAudio && (
                  <div>
                    <Button
                      onClick={testAudioLevel}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Test Microphone (10s)
                    </Button>
                  </div>
                )}

              {testingAudio && (
                <div className="text-center">
                  <div className="text-sm text-blue-600 font-medium mb-2">
                    Testing microphone... Speak now!
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Audio Level: {Math.round(audioLevel * 100)}% | Device:{" "}
                    {audioDevices.find((d) => d.deviceId === selectedDevice)
                      ?.label || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    {microphoneConnected
                      ? "✅ Microphone connected"
                      : "❌ Microphone not connected"}
                    {audioLevel > 0
                      ? " | 🔊 Audio detected"
                      : " | 🔇 No audio - try speaking louder"}
                  </div>
                  <Button onClick={stopAudioTest} variant="outline" size="sm">
                    Stop Test
                  </Button>
                </div>
              )}

              {/* Timer Display */}
              {timeRemaining > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Time Remaining
                  </label>
                  <div className="text-2xl font-mono font-bold text-center p-4 bg-gray-100 rounded-lg">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              )}

              {/* Recording Controls */}
              <div className="flex gap-2 justify-center">
                {recordingState === "idle" && (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700"
                    disabled={!permissionGranted}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                )}

                {recordingState === "recording" && (
                  <>
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      size="lg"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      size="lg"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}

                {recordingState === "paused" && (
                  <>
                    <Button
                      onClick={resumeRecording}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      size="lg"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}

                {recordingState === "stopped" && (
                  <Button
                    onClick={transcribeAudio}
                    size="lg"
                    disabled={transcriptionState === "processing"}
                  >
                    {transcriptionState === "processing"
                      ? "Processing..."
                      : "Transcribe Audio"}
                  </Button>
                )}
              </div>

              {/* Recording Status */}
              <div className="text-center">
                <Badge
                  variant={
                    recordingState === "recording" ? "default" : "secondary"
                  }
                >
                  {recordingState === "idle" &&
                    !testingAudio &&
                    "Ready to record"}
                  {recordingState === "idle" &&
                    testingAudio &&
                    "Testing microphone"}
                  {recordingState === "recording" && "Recording..."}
                  {recordingState === "paused" && "Paused"}
                  {recordingState === "stopped" && "Recording complete"}
                </Badge>
                {testingAudio && (
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      Microphone active
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transcription Results */}
          <Card>
            <CardHeader>
              <CardTitle>Transcription Results</CardTitle>
              <CardDescription>
                Review and edit your consultation transcription
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transcriptionState === "idle" && (
                <div className="text-center text-gray-500 py-8">
                  Complete a recording to see transcription results
                </div>
              )}

              {transcriptionState === "processing" && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Processing transcription...</p>
                </div>
              )}

              {transcriptionState === "completed" && (
                <div>
                  <Textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Transcription will appear here..."
                  />
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportAsText}>
                      Export as Text
                    </Button>
                  </div>
                </div>
              )}

              {transcriptionState === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to process transcription. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
