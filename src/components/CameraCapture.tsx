import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CameraCaptureProps {
  open: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ open, onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const videoCallback = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setError("");
    setReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Kamerazugriff wird von diesem Browser nicht unterstützt.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setError("Kamerazugriff verweigert oder nicht verfügbar. Bitte Kamerarechte im Browser erlauben.");
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], "kamera.jpg", { type: "image/jpeg" }));
        onClose();
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-4 gap-4">
        {error ? (
          <p className="text-sm text-red-600 py-6 text-center">{error}</p>
        ) : (
          <>
            <video
              ref={videoCallback}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setReady(true)}
              className="w-full rounded-xl bg-black aspect-video object-cover"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={capture}
                disabled={!ready}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4" />
                Aufnehmen
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-12 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
