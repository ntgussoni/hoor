"use client";

import { Timer as TimerIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface TimerProps {
  timerDuration: number;
  onDurationChange: (duration: number) => void;
  timeRemaining: number;
  recordingState: string;
}

export function Timer({
  timerDuration,
  onDurationChange,
  timeRemaining,
}: TimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Timer Setting */}
      <div>
        <Label htmlFor="timer-select" className="text-sm font-medium mb-2">
          Recording Timer
        </Label>
        <Select
          value={timerDuration.toString()}
          onValueChange={(value) => onDurationChange(parseInt(value))}
        >
          <SelectTrigger id="timer-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 minutes</SelectItem>
            <SelectItem value="5">5 minutes</SelectItem>
            <SelectItem value="10">10 minutes</SelectItem>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="20">20 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">60 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timer Display */}
      {timeRemaining > 0 && (
        <div>
          <Separator className="my-4" />
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <TimerIcon className="h-4 w-4" />
            Time Remaining
          </Label>
          <div className="text-2xl font-mono font-bold text-center p-4 bg-gray-100 rounded-lg">
            {formatTime(timeRemaining)}
          </div>
        </div>
      )}
    </div>
  );
}
