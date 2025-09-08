"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Import our new components
import { AudioControls } from "@/components/AudioControls";
import { Timer } from "@/components/Timer";
import { RecordingControls } from "@/components/RecordingControls";
import { TranscriptionDisplay } from "@/components/TranscriptionDisplay";
import { useRecording } from "@/hooks/useRecording";

type TranscriptionState = "idle" | "processing" | "completed" | "error";

interface AudioDevice {
  deviceId: string;
  label: string;
}

export default function Home() {
  // Use our custom recording hook
  const {
    recordingState,
    timerDuration,
    timeRemaining,
    audioLevel,
    audioChunks,
    setTimerDuration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearAudioChunks,
    testAudio,
    cleanup,
  } = useRecording();

  // Other state
  const [transcriptionState, setTranscriptionState] =
    useState<TranscriptionState>("idle");
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [language, setLanguage] = useState<string>("nl"); // Dutch default
  const [transcription, setTranscription] = useState<string>("");
  const [originalTranscription, setOriginalTranscription] =
    useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [testingAudio, setTestingAudio] = useState<boolean>(false);
  const [microphoneConnected, setMicrophoneConnected] =
    useState<boolean>(false);
  const [shareableLink, setShareableLink] = useState<string>("");

  // Refs for audio testing - now handled by the hook

  // Initialize audio devices
  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          }));
        setAudioDevices(audioDevices);
        if (audioDevices.length > 0) {
          setSelectedDevice(audioDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting audio devices:", error);
      }
    };

    getAudioDevices();
  }, []);

  // Check microphone permission
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setPermissionGranted(true);
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setPermissionGranted(false);
      }
    };

    checkPermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Wrapper functions for recording that pass the selected device
  const handleStartRecording = () => {
    // Clear previous audio chunks and transcription when starting new recording
    clearAudioChunks();
    setTranscription("");
    setOriginalTranscription("");
    setAudioUrl("");
    setShareableLink("");
    setTranscriptionState("idle");
    startRecording(selectedDevice);
    toast.success("Recording started", {
      description: "Your veterinary consultation is being recorded",
    });
  };

  // Audio testing functions
  const testAudioLevel = async () => {
    try {
      setError("");
      setTestingAudio(true);
      setMicrophoneConnected(true);

      // Use the hook's testAudio function
      await testAudio(selectedDevice);

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
    // The hook will handle audio context cleanup
  };

  // Transcription functions
  const transcribeAudio = async () => {
    if (audioChunks.length === 0) return;

    setTranscriptionState("processing");
    setError("");

    try {
      const audioBlob = new Blob(audioChunks, {
        type: "audio/webm",
      });

      // Step 1: Get signed upload URL from backend
      const uploadUrlResponse = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: `recording-${Date.now()}.webm`,
          contentType: "audio/webm",
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, key } = await uploadUrlResponse.json();

      // Step 2: Upload audio to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: audioBlob,
        headers: {
          "Content-Type": "audio/webm",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload audio");
      }

      // Step 3: Transcribe using the uploaded audio
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioKey: key,
          language: language,
        }),
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const {
        transcription: filteredTranscription,
        originalTranscription: rawTranscription,
        audioUrl: apiAudioUrl,
      } = await transcribeResponse.json();

      setTranscription(filteredTranscription);
      setOriginalTranscription(rawTranscription);

      // Use the audio URL from the API response
      setAudioUrl(apiAudioUrl);

      setTranscriptionState("completed");
      toast.success("Transcription completed", {
        description: "Your consultation has been transcribed and structured",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to transcribe audio. Please try again.";
      setError(errorMessage);
      setTranscriptionState("error");
      toast.error("Transcription failed", {
        description: errorMessage,
      });
    }
  };

  // Utility functions
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Audio download started");
    }
  };

  const generateShareableLink = async () => {
    try {
      const response = await fetch("/api/generate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription,
          originalTranscription,
          audioUrl,
        }),
      });

      if (response.ok) {
        const { link } = await response.json();
        setShareableLink(link);
      }
    } catch (error) {
      console.error("Failed to generate shareable link:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Veterinary Recording & Transcription
          </h1>
          <p className="text-gray-600">
            Record veterinary consultations and get structured medical charts
          </p>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={`grid grid-cols-1 gap-6 ${
            transcription ||
            originalTranscription ||
            transcriptionState === "processing"
              ? "lg:grid-cols-3"
              : "lg:grid-cols-1 lg:max-w-2xl lg:mx-auto"
          }`}
        >
          {/* Left Column - Recording Controls */}
          <Card
            className={`h-fit ${
              transcription ||
              originalTranscription ||
              transcriptionState === "processing"
                ? "lg:col-span-1"
                : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                Recording Studio
              </CardTitle>
              <CardDescription>
                Configure your recording settings and start recording
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div>
                <Label
                  htmlFor="language-select"
                  className="text-sm font-medium mb-2"
                >
                  Language
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nl">Dutch (Nederlands)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish (Español)</SelectItem>
                    <SelectItem value="fr">French (Français)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Controls Component */}
              <Separator />
              <AudioControls
                audioDevices={audioDevices}
                selectedDevice={selectedDevice}
                onDeviceChange={setSelectedDevice}
                audioLevel={audioLevel}
                testingAudio={testingAudio}
                recordingState={recordingState}
                permissionGranted={permissionGranted}
                onTestAudio={testAudioLevel}
                onStopTest={stopAudioTest}
                microphoneConnected={microphoneConnected}
              />

              {/* Timer Component */}
              <Separator />
              <Timer
                timerDuration={timerDuration}
                onDurationChange={setTimerDuration}
                timeRemaining={timeRemaining}
                recordingState={recordingState}
              />

              {/* Recording Controls Component */}
              <Separator />
              <RecordingControls
                recordingState={recordingState}
                testingAudio={testingAudio}
                onStartRecording={handleStartRecording}
                onPauseRecording={pauseRecording}
                onResumeRecording={resumeRecording}
                onStopRecording={stopRecording}
                onTranscribeAudio={transcribeAudio}
                hasAudio={audioChunks.length > 0}
                transcriptionState={transcriptionState}
              />
            </CardContent>
          </Card>

          {/* Right Column - Transcription - Only show when there's a transcription */}
          {(transcription ||
            originalTranscription ||
            transcriptionState === "processing") && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Medical Chart Generator
                </CardTitle>
                <CardDescription>
                  Transcribe your recording and view the structured medical
                  chart
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Transcription Display Component */}
                <TranscriptionDisplay
                  transcription={transcription}
                  originalTranscription={originalTranscription}
                  transcriptionState={transcriptionState}
                  audioUrl={audioUrl}
                  hasAudio={audioChunks.length > 0}
                  onCopyToClipboard={copyToClipboard}
                  onDownloadAudio={downloadAudio}
                  onGenerateShareableLink={generateShareableLink}
                  shareableLink={shareableLink}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
