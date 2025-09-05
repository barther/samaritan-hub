import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, Scan, AlertCircle, CheckCircle } from "lucide-react";
import { BrowserPDF417Reader } from "@zxing/browser";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserPDF417Reader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && !readerRef.current) {
      readerRef.current = new BrowserPDF417Reader();
    }
  }, [open]);

  const parsePDF417Data = (rawData: string): ScannedData => {
    console.log('Raw PDF417 data:', rawData);
    
    // PDF417 on driver's licenses follows AAMVA standard
    // Data is typically separated by line feeds (\n) or specific delimiters
    const lines = rawData.split(/[\n\r]+/);
    
    let firstName = '';
    let lastName = '';
    let address = '';
    let city = '';
    let state = '';
    let zipCode = '';
    let dateOfBirth = '';
    let licenseNumber = '';

    // Common AAMVA field identifiers
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Name parsing - different formats possible
      if (trimmedLine.includes('DAC') || trimmedLine.includes('DCT')) {
        // First name
        firstName = trimmedLine.split(/DAC|DCT/)[1]?.trim() || '';
      } else if (trimmedLine.includes('DCS')) {
        // Last name  
        lastName = trimmedLine.split('DCS')[1]?.trim() || '';
      }
      
      // Address parsing
      if (trimmedLine.includes('DAG')) {
        address = trimmedLine.split('DAG')[1]?.trim() || '';
      }
      
      // City
      if (trimmedLine.includes('DAI')) {
        city = trimmedLine.split('DAI')[1]?.trim() || '';
      }
      
      // State
      if (trimmedLine.includes('DAJ')) {
        state = trimmedLine.split('DAJ')[1]?.trim() || '';
      }
      
      // ZIP Code
      if (trimmedLine.includes('DAK')) {
        zipCode = trimmedLine.split('DAK')[1]?.trim() || '';
      }
      
      // Date of Birth
      if (trimmedLine.includes('DBB')) {
        dateOfBirth = trimmedLine.split('DBB')[1]?.trim() || '';
      }
      
      // License Number
      if (trimmedLine.includes('DAQ')) {
        licenseNumber = trimmedLine.split('DAQ')[1]?.trim() || '';
      }
    }

    // Fallback parsing for simpler formats
    if (!firstName && !lastName && lines.length > 0) {
      // Try to parse name from first few lines
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].trim();
        if (line.length > 2 && /^[A-Z\s]+$/.test(line)) {
          const nameParts = line.split(/\s+/);
          if (nameParts.length >= 2) {
            lastName = nameParts[0];
            firstName = nameParts.slice(1).join(' ');
            break;
          }
        }
      }
    }

    return {
      firstName: firstName || '',
      lastName: lastName || '',
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      dateOfBirth,
      licenseNumber
    };
  };

  const startScanning = async () => {
    try {
      setError(null);
      setSuccess(false);
      setIsScanning(true);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start scanning
        if (readerRef.current) {
          try {
            const result = await readerRef.current.decodeOnceFromVideoDevice(undefined, videoRef.current);
            
            console.log('Barcode scan result:', result.getText());
            
            // Parse the scanned data
            const parsedData = parsePDF417Data(result.getText());
            
            // Verify we got some useful data
            if (parsedData.firstName || parsedData.lastName || parsedData.address) {
              setSuccess(true);
              setTimeout(() => {
                onDataScanned(parsedData);
                stopScanning();
                onOpenChange(false);
                
                toast({
                  title: "License Scanned Successfully",
                  description: `Parsed information for ${parsedData.firstName} ${parsedData.lastName}`,
                });
              }, 1000);
            } else {
              throw new Error("Could not extract valid information from barcode");
            }
            
          } catch (scanError) {
            console.error('Scanning error:', scanError);
            setError("Could not read barcode. Please ensure the PDF417 barcode is clearly visible and try again.");
          }
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError("Could not access camera. Please ensure camera permissions are granted.");
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Scan Driver's License
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hold your driver's license so the PDF417 barcode (on the back) is clearly visible to the camera.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Barcode scanned successfully! Processing data...</AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
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
                {/* Scanning overlay */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-64 h-40 border-2 border-white rounded-lg"></div>
                  <p className="text-white text-center mt-2 text-sm">
                    Position barcode within the frame
                  </p>
                </div>
                
                {/* Scanning animation */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-40">
                  <div className="w-full h-0.5 bg-red-500 animate-pulse"></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            {isScanning && (
              <Button variant="destructive" onClick={stopScanning}>
                Stop Scanning
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};