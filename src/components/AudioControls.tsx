"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface AudioControlsProps {
  audioDevices: AudioDevice[];
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
  audioLevel: number;
  testingAudio: boolean;
  recordingState: string;
  permissionGranted: boolean;
  onTestAudio: () => void;
  onStopTest: () => void;
  microphoneConnected: boolean;
}

export function AudioControls({
  audioDevices,
  selectedDevice,
  onDeviceChange,
  audioLevel,
  testingAudio,
  recordingState,
  permissionGranted,
  onTestAudio,
  onStopTest,
  microphoneConnected,
}: AudioControlsProps) {
  return (
    <div className="space-y-4">
      {/* Audio Device Selection */}
      <div>
        <Label htmlFor="microphone-select" className="text-sm font-medium mb-2">
          Microphone Device
        </Label>
        <Select value={selectedDevice} onValueChange={onDeviceChange}>
          <SelectTrigger id="microphone-select">
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

      {/* Audio Level Visualization - Always Visible */}
      <div>
        <Label className="text-sm font-medium mb-2 flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Audio Level
          {testingAudio && (
            <span className="text-blue-600 font-medium">(Testing)</span>
          )}
          {recordingState === "recording" && (
            <span className="text-red-600 font-medium">(Recording)</span>
          )}
        </Label>
        <div className="space-y-2">
          <Progress
            value={audioLevel * 100}
            className={`h-3 ${
              recordingState === "recording"
                ? "bg-red-100"
                : testingAudio
                ? "bg-blue-100"
                : ""
            }`}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Silent</span>
            <span
              className={`font-medium ${
                audioLevel > 0.5
                  ? "text-green-600"
                  : audioLevel > 0.2
                  ? "text-yellow-600"
                  : "text-gray-500"
              }`}
            >
              {Math.round(audioLevel * 100)}%
            </span>
            <span>Loud</span>
          </div>
        </div>
      </div>

      {/* Test Audio Button */}
      {permissionGranted && recordingState === "idle" && !testingAudio && (
        <div>
          <Separator className="my-4" />
          <Button
            onClick={onTestAudio}
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
            {audioDevices.find((d) => d.deviceId === selectedDevice)?.label ||
              "Unknown"}
          </div>
          <div className="text-xs text-gray-400 mb-2">
            {microphoneConnected
              ? "✅ Microphone connected"
              : "❌ Microphone not connected"}
            {audioLevel > 0
              ? " | 🔊 Audio detected"
              : " | 🔇 No audio - try speaking louder"}
          </div>
          <Button onClick={onStopTest} variant="outline" size="sm">
            Stop Test
          </Button>
        </div>
      )}
    </div>
  );
}
