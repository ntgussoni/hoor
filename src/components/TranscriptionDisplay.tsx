"use client";

import { useState } from "react";
import { Copy, Download, Link, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface TranscriptionDisplayProps {
  transcription: string;
  originalTranscription: string;
  transcriptionState: string;
  audioUrl: string;
  hasAudio: boolean;
  onCopyToClipboard: (text: string) => void;
  onDownloadAudio: () => void;
  onGenerateShareableLink: () => void;
  shareableLink: string;
}

export function TranscriptionDisplay({
  transcription,
  originalTranscription,
  transcriptionState,
  audioUrl,
  hasAudio,
  onCopyToClipboard,
  onDownloadAudio,
  onGenerateShareableLink,
  shareableLink,
}: TranscriptionDisplayProps) {
  const [activeTab, setActiveTab] = useState("filtered");

  return (
    <div className="space-y-4">
      {/* Transcription Controls - Only show if there's audio to transcribe */}

      {/* Show message when no audio is available */}
      {!hasAudio && (
        <div className="text-center py-8 text-gray-500">
          <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No recording available</p>
          <p className="text-sm">
            Record some audio to see transcription options
          </p>
        </div>
      )}

      {/* Transcription Status */}
      {transcriptionState === "processing" && (
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Transcribing audio... This may take a moment.
            </Badge>
          </div>

          {/* Loading skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      )}

      {/* Transcription Results */}
      {(transcription || originalTranscription) && (
        <div className="space-y-4">
          <Separator />
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="filtered">Medical Chart</TabsTrigger>
              <TabsTrigger value="original">Raw Transcription</TabsTrigger>
            </TabsList>

            <TabsContent value="filtered" className="space-y-4">
              <div className="bg-white p-4 rounded-lg border min-h-[200px]">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {transcription || "No filtered transcription available"}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onCopyToClipboard(transcription)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Chart
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="original" className="space-y-4">
              <div className="bg-white p-4 rounded-lg border min-h-[200px]">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {originalTranscription ||
                    "No original transcription available"}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onCopyToClipboard(originalTranscription)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Raw
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Audio Controls */}
      {audioUrl && (
        <div className="space-y-4">
          <div className="text-center">
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/webm" />
              Your browser does not support the audio element.
            </audio>
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={onDownloadAudio} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Audio
            </Button>
            <Button
              onClick={onGenerateShareableLink}
              variant="outline"
              size="sm"
            >
              <Link className="h-4 w-4 mr-2" />
              Generate Link
            </Button>
          </div>

          {shareableLink && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Shareable Link:</div>
              <div className="bg-gray-100 p-2 rounded text-xs break-all">
                {shareableLink}
              </div>
              <Button
                onClick={() => onCopyToClipboard(shareableLink)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
