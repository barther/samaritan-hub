import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, Scan, AlertCircle, CheckCircle, Sun } from "lucide-react";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  IScannerControls,
} from "@zxing/browser";
import { useToast } from "@/hooks/use-toast";

interface ScannedData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth?: string;
  licenseNumber?: string;
}

interface PDF417ScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataScanned: (data: ScannedData) => void;
}

export const PDF417Scanner = ({ open, onOpenChange, onDataScanned }: PDF417ScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const { toast } = useToast();

  // --- Utils -----------------------------------------------------------------

  const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);

  const preflightPermission = useCallback(async () => {
    // HTTPS required on iOS (localhost allowed)
    if (!window.isSecureContext && location.hostname !== "localhost") {
      throw new Error("Camera requires HTTPS (or localhost).");
    }
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
    tmp.getTracks().forEach((t) => t.stop());
  }, []);

  const pickBackCamera = useCallback(async (): Promise<string | undefined> => {
    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    // On iOS, labels only appear after preflight
    const back = devices.find(
      (d) => /back|rear|environment/i.test(d.label) || /facing back/i.test(d.label)
    );
    return (back ?? devices[0])?.deviceId;
  }, []);

  const applyCameraTuning = useCallback(async () => {
    const stream = (videoRef.current?.srcObject as MediaStream) || null;
    const track = stream?.getVideoTracks?.()[0];
    const capabilities: any = track?.getCapabilities?.();
    if (!track || !capabilities) return;

    const advanced: any[] = [];

    if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }

    if (typeof capabilities.zoom === "number") {
      // Some implementations expose zoom as number; most expose {min,max,step}
      // We'll skip this case because we can't set a numeric zoom without the range.
    } else if (capabilities.zoom && typeof capabilities.zoom === "object") {
      const { min, max } = capabilities.zoom as { min: number; max: number };
      if (typeof min === "number" && typeof max === "number" && max > min) {
        advanced.push({ zoom: (min + max) / 2 });
      }
    }

    if (advanced.length) {
      try {
        await track.applyConstraints({ advanced });
      } catch {
        /* best effort only */
      }
    }
  }, []);

  const toggleTorch = useCallback(
    async (on: boolean) => {
      const stream = (videoRef.current?.srcObject as MediaStream) || null;
      const track = stream?.getVideoTracks?.()[0];
      const capabilities: any = track?.getCapabilities?.();
      if (!track || !capabilities?.torch) {
        setTorchOn(false);
        return;
      }
      try {
        await track.applyConstraints({ advanced: [{ torch: on }] as any });
        setTorchOn(on);
      } catch {
        setTorchOn(false);
      }
    },
    []
  );

  // --- AAMVA Parser ----------------------------------------------------------

  const normalizeDob = (s?: string) => {
    if (!s) return undefined;
    const raw = s.replace(/\D/g, "");
    if (/^\d{8}$/.test(raw)) {
      // Prefer YYYYMMDD; else treat as MMDDYYYY
      return +raw.slice(0, 4) > 1900
        ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
        : `${raw.slice(4, 8)}-${raw.slice(0, 2)}-${raw.slice(2, 4)}`;
    }
    return s;
  };

  const normalizeZip = (s?: string) => (s?.replace(/[^\d-]/g, "").slice(0, 5) || "");

  const parsePDF417Data = (rawData: string): ScannedData => {
    const lines = rawData.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

    const get = (key: string) =>
      lines.find((l) => l.startsWith(key))?.slice(key.length).trim() ?? "";

    let lastName = get("DCS");
    let firstName = get("DAC") || get("DCT"); // some states use DCT for first+middle
    const fullName = get("DAA"); // optional "LAST,FIRST MIDDLE"

    if (!firstName && !lastName && fullName) {
      const [ln, rest] = fullName.split(",", 2);
      if (ln && rest) {
        lastName = ln.trim();
        firstName = rest.trim().split(/\s+/).slice(0, 2).join(" ");
      }
    }

    const address = get("DAG");
    const city = get("DAI");
    const state = get("DAJ");
    const zipCode = normalizeZip(get("DAK"));
    const dateOfBirth = normalizeDob(get("DBB"));
    const licenseNumber = get("DAQ") || undefined;

    // Fallback name if still empty (rare older cards)
    if (!firstName && !lastName) {
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        if (line.length > 2 && /^[A-Z\s,]+$/.test(line)) {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            lastName = parts[0];
            firstName = parts.slice(1).join(" ");
            break;
          }
        }
      }
    }

    return {
      firstName: firstName || "",
      lastName: lastName || "",
      address: address || "",
      city: city || "",
      state: state || "",
      zipCode,
      dateOfBirth,
      licenseNumber,
    };
  };

  // --- ZXing setup & lifecycle ----------------------------------------------

  // Initialize the reader optimized for PDF417
  useEffect(() => {
    if (open && !readerRef.current) {
      // Create reader optimized for PDF417 scanning
      readerRef.current = new BrowserMultiFormatReader();
    }
  }, [open]);

  // Stop scanning when dialog closes or component unmounts
  useEffect(() => {
    if (!open) stopScanning();
    return () => stopScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Pause if the tab/page becomes hidden (saves battery & avoids iOS quirks)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopScanning();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDecode: Parameters<BrowserMultiFormatReader["decodeFromVideoDevice"]>[2] = (
    result,
    err,
    controls
  ) => {
    if (result) {
      const parsed = parsePDF417Data(result.getText());
      setSuccess(true);
      controls.stop(); // stop immediately to prevent double-fires
      onDataScanned(parsed);
      onOpenChange(false);
      toast({
        title: "License Scanned Successfully",
        description: `Parsed info for ${parsed.firstName ?? ""} ${parsed.lastName ?? ""}`.trim(),
      });
    }
    // Ignore err (NotFoundException etc.) while scanning
  };

  const startWithConstraintsFallback = useCallback(async () => {
    // Try exact back camera first (may fail on some Safari builds)
    try {
      controlsRef.current = await readerRef.current!.decodeFromConstraints(
        { video: { facingMode: { exact: "environment" } } as any },
        videoRef.current!,
        onDecode
      );
      return;
    } catch {
      // fall through
    }
    // Soft prefer back camera
    try {
      controlsRef.current = await readerRef.current!.decodeFromConstraints(
        { video: { facingMode: "environment" } as any },
        videoRef.current!,
        onDecode
      );
      return;
    } catch {
      // fall through
    }
    // Generic fallback
    controlsRef.current = await readerRef.current!.decodeFromConstraints(
      { video: true },
      videoRef.current!,
      onDecode
    );
  }, [onDecode]);

  const startScanning = useCallback(async () => {
    setError(null);
    setSuccess(false);
    setIsScanning(true);
    setTorchOn(false);

    try {
      // Avoid starting during dialog mount animation (Safari quirk)
      await new Promise((r) => setTimeout(r, 50));

      if (isIOS()) {
        await preflightPermission(); // unlock enumerateDevices on iOS
      }

      const deviceId = await pickBackCamera();

      if (deviceId) {
        try {
          controlsRef.current = await readerRef.current!.decodeFromVideoDevice(
            deviceId,
            videoRef.current!,
            onDecode
          );
        } catch {
          await startWithConstraintsFallback();
        }
      } else {
        await startWithConstraintsFallback();
      }

      // After stream is live, try focus/zoom tuning
      setTimeout(applyCameraTuning, 300);
    } catch (e: any) {
      console.error("Camera error:", e);
      const msg =
        e?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in browser settings."
          : e?.message || "Camera failed to start.";
      setError(msg);
      setIsScanning(false);
    }
  }, [applyCameraTuning, onDecode, pickBackCamera, preflightPermission, startWithConstraintsFallback]);

  const stopScanning = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    // Switch torch off if it was on
    if (torchOn) {
      toggleTorch(false).catch(() => {});
    }

    const media = videoRef.current?.srcObject as MediaStream | null;
    if (media) {
      media.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setSuccess(false);
    setError(null);
    setTorchOn(false);
  }, [toggleTorch, torchOn]);

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  // --- Render ----------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Scan Driver&apos;s License
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert role="status" aria-live="polite">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hold your driver&apos;s license so the PDF417 barcode (on the back) is clearly visible to the camera.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert role="status" aria-live="polite">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Barcode scanned successfully! Processing data...</AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              muted
              autoPlay
            />

            {!isScanning && !success && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Button onClick={startScanning} size="lg" className="gap-2">
                  <Camera className="h-5 w-5" />
                  Start Camera
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Framing guide */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-64 h-40 border-2 border-white rounded-lg"></div>
                  <p className="text-white text-center mt-2 text-sm">Position barcode within the frame</p>
                </div>
                {/* Scan line (requires @keyframes scanLine in global CSS) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 overflow-hidden">
                  <div
                    className="w-full h-0.5 bg-red-500 absolute"
                    style={{ animation: "scanLine 2s ease-in-out infinite alternate" }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2">
            <div>
              {isScanning && (
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => toggleTorch(!torchOn)}
                >
                  <Sun className="h-4 w-4" />
                  {torchOn ? "Torch Off" : "Torch On"}
                </Button>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                {isScanning ? "Cancel" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};