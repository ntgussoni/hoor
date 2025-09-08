"use client";

import { Mic, Pause, Play, Square, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RecordingControlsProps {
  recordingState: string;
  testingAudio: boolean;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onTranscribeAudio?: () => void;
  hasAudio?: boolean;
  transcriptionState?: string;
}

export function RecordingControls({
  recordingState,
  testingAudio,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onTranscribeAudio,
  hasAudio,
  transcriptionState,
}: RecordingControlsProps) {
  return (
    <div className="space-y-4">
      {/* Recording Status */}
      <div className="text-center">
        <Badge
          variant={
            recordingState === "recording"
              ? "destructive"
              : recordingState === "paused"
              ? "secondary"
              : recordingState === "stopped"
              ? "default"
              : "outline"
          }
          className={`text-lg px-4 py-2 ${
            recordingState === "recording" ? "animate-pulse" : ""
          }`}
        >
          {recordingState === "idle" &&
            !testingAudio &&
            "Ready to record"}
          {recordingState === "idle" &&
            testingAudio &&
            "Testing microphone"}
          {recordingState === "recording" && "🔴 Recording..."}
          {recordingState === "paused" && "⏸️ Paused"}
          {recordingState === "stopped" && "✅ Recording complete"}
        </Badge>
        {testingAudio && (
          <div className="mt-2">
            <div className="inline-flex items-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              Microphone active
            </div>
          </div>
        )}
        {recordingState === "recording" && (
          <div className="mt-2">
            <div className="inline-flex items-center gap-2 text-sm text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              Recording in progress
            </div>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex gap-2 justify-center">
        {recordingState === "idle" && (
          <Button
            onClick={onStartRecording}
            size="lg"
            className="bg-red-600 hover:bg-red-700"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        )}

        {recordingState === "recording" && (
          <>
            <Button
              onClick={onPauseRecording}
              variant="outline"
              size="lg"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button
              onClick={onStopRecording}
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
              onClick={onResumeRecording}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
            <Button
              onClick={onStopRecording}
              variant="destructive"
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Transcribe Button - Show after recording is stopped */}
      {recordingState === "stopped" && hasAudio && onTranscribeAudio && (
        <>
          <Separator />
          <div className="text-center">
            <Button
              onClick={onTranscribeAudio}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={transcriptionState === "processing"}
            >
              <FileText className="h-4 w-4 mr-2" />
              {transcriptionState === "processing" ? "Transcribing..." : "Transcribe Audio"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
