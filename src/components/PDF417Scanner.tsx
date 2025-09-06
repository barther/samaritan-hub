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

  // ─── AAMVA Parsing Helpers ────────────────────────────────────────────────

  const normalizeDob = (s?: string) => {
    if (!s) return undefined;
    const raw = s.replace(/\D/g, "");
    if (/^\d{8}$/.test(raw)) {
      return +raw.slice(0, 4) > 1900
        ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
        : `${raw.slice(4, 8)}-${raw.slice(0, 2)}-${raw.slice(2, 4)}`;
    }
    return s;
  };

  const normalizeZip = (s?: string) => s?.replace(/[^\d]/g, "").slice(0, 5) || "";

  const parsePDF417Data = (rawData: string): ScannedData => {
    const lines = rawData.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    const get = (key: string) =>
      lines.find((l) => l.startsWith(key))?.slice(key.length).trim() ?? "";

    let lastName = get("DCS");
    let firstName = get("DAC") || get("DCT");
    const fullName = get("DAA"); // fallback

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

    if (!firstName && !lastName) {
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const parts = lines[i].split(/\s+/);
        if (parts.length >= 2 && /^[A-Z]+$/.test(parts[0])) {
          lastName = parts[0];
          firstName = parts.slice(1).join(" ");
          break;
        }
      }
    }

    return { firstName, lastName, address, city, state, zipCode, dateOfBirth, licenseNumber };
  };

  // ─── Torch Control ─────────────────────────────────────────────────────────

  const toggleTorch = useCallback(async (on: boolean) => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()?.[0];
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
  }, []);

  // ─── ZXing Reader Init ────────────────────────────────────────────────────

  useEffect(() => {
    if (open && !readerRef.current) {
      // Create reader optimized for PDF417 scanning
      const reader = new BrowserMultiFormatReader();
      // zero delay between decode attempts for faster detection
      try { (reader as any).timeBetweenDecodingAttempts = 0; } catch {}
      readerRef.current = reader;
    }
  }, [open]);

  // ─── Lifecycle Cleanup ─────────────────────────────────────────────────────

  // stop when dialog closes or unmounts
  useEffect(() => {
    if (!open) stopScanning();
    return () => stopScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // pause if tab hidden
  useEffect(() => {
    const onVis = () => document.hidden && stopScanning();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Core Decode Callback ─────────────────────────────────────────────────

  const onDecode = useCallback(
    (_result: any, _err: any, controls: IScannerControls) => {
      if (_result) {
        const text = _result.getText();
        console.log("Barcode detected:", text);
        const parsed = parsePDF417Data(text);
        setSuccess(true);
        controls.stop();
        onDataScanned(parsed);
        onOpenChange(false);
        toast({
          title: "License Scanned Successfully",
          description: `Parsed info for ${parsed.firstName} ${parsed.lastName}`.trim(),
        });
      }
      // Ignore errors - they're normal during scanning
    },
    [onDataScanned, onOpenChange, toast]
  );

  // ─── Start / Stop Scanning ─────────────────────────────────────────────────

  const startScanning = useCallback(async () => {
    setError(null);
    setSuccess(false);
    setIsScanning(true);
    setTorchOn(false);

    try {
      // iOS/Safari needs this tiny delay so the video element is fully visible
      await new Promise((r) => setTimeout(r, 50));

      // Preferred back camera + HD
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
      } as MediaStreamConstraints;

      controlsRef.current = await readerRef.current!.decodeFromConstraints(
        constraints,
        videoRef.current!,
        onDecode
      );

      // optional: quick focus/zoom tweak after camera live
      setTimeout(() => {
        const stream = videoRef.current!.srcObject as MediaStream;
        const track = stream?.getVideoTracks?.()?.[0];
        const caps: any = track?.getCapabilities?.();
        if (caps?.focusMode?.includes?.("continuous")) {
          track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] }).catch(() => {});
        }
      }, 300);
    } catch (e: any) {
      console.error("Camera error:", e);
      setError(
        e.name === "NotAllowedError"
          ? "Camera permission denied."
          : e.message || "Failed to start camera."
      );
      setIsScanning(false);
    }
  }, [onDecode]);

  const stopScanning = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    
    // Stop torch if it was on
    if (torchOn) {
      toggleTorch(false).catch(() => {});
    }
    
    // Clean up media streams
    if (videoRef.current?.srcObject) {
      (videoRef.current!.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current!.srcObject = null;
    }
    
    setIsScanning(false);
    setSuccess(false);
    setError(null);
    setTorchOn(false);
  }, [torchOn, toggleTorch]);

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" /> Scan Driver's License
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert role="status" aria-live="polite">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hold your driver's license so the PDF417 barcode (on the back) is clearly visible.
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
              <AlertDescription>
                Barcode scanned! Processing…
              </AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden h-80">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {!isScanning && !success && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Button onClick={startScanning} size="lg" className="gap-2">
                  <Camera className="h-5 w-5" /> Start Camera
                </Button>
              </div>
            )}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-40 border-2 border-white rounded-lg"></div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 overflow-hidden">
                  <div
                    className="w-full h-0.5 bg-red-500 absolute"
                    style={{ animation: "scanLine 2s ease-in-out infinite alternate" }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            {isScanning && (
              <Button variant="secondary" onClick={() => toggleTorch(!torchOn)} className="gap-2">
                <Sun className="h-4 w-4" /> {torchOn ? "Torch Off" : "Torch On"}
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} className="ml-auto">
              <X className="h-4 w-4 mr-2" /> {isScanning ? "Cancel" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};