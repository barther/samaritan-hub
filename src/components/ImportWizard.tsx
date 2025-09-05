import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  FileText, 
  Users, 
  DollarSign, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  ArrowRight,
  FileSpreadsheet,
  File
} from "lucide-react";

interface ParsedData {
  type: 'clients' | 'interactions' | 'donations' | 'disbursements';
  data: any[];
  preview: string;
}

interface ImportWizardProps {
  trigger: React.ReactNode;
}

export const ImportWizard = ({ trigger }: ImportWizardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importType, setImportType] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    { extension: '.docx', description: 'Word Documents', icon: FileText },
    { extension: '.csv', description: 'CSV Files', icon: FileSpreadsheet },
    { extension: '.txt', description: 'Text Files', icon: File },
    { extension: '.xlsx', description: 'Excel Files', icon: FileSpreadsheet }
  ];

  const importTypes = [
    { 
      value: 'clients', 
      label: 'Client Records', 
      icon: Users,
      description: 'Import client information and demographics',
      fields: ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip_code', 'county']
    },
    { 
      value: 'interactions', 
      label: 'Client Interactions', 
      icon: MessageSquare,
      description: 'Import interaction logs and communications',
      fields: ['contact_name', 'channel', 'summary', 'occurred_at', 'status', 'assistance_type', 'requested_amount']
    },
    { 
      value: 'donations', 
      label: 'Donations', 
      icon: DollarSign,
      description: 'Import donation records and donor information', 
      fields: ['donor_name', 'amount', 'donation_date', 'source', 'notes']
    },
    { 
      value: 'disbursements', 
      label: 'Disbursements', 
      icon: DollarSign,
      description: 'Import assistance payments and disbursements',
      fields: ['recipient_name', 'amount', 'disbursement_date', 'assistance_type', 'payment_method', 'notes']
    }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const parseFile = async () => {
    if (!file || !importType) return;
    
    setIsProcessing(true);
    try {
      const fileContent = await file.text();
      let parsedData: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = fileContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        parsedData = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.docx')) {
        // For text files and Word docs, try to extract structured data
        // This is a simplified parser - in production you'd want more sophisticated parsing
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        if (importType === 'interactions') {
          // Try to parse interaction logs
          let currentInteraction: any = {};
          parsedData = [];
          
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes('Date:') || trimmed.includes('date:')) {
              if (currentInteraction.contact_name || currentInteraction.summary) {
                parsedData.push({...currentInteraction});
              }
              currentInteraction = { occurred_at: extractDate(trimmed) };
            } else if (trimmed.includes('Client:') || trimmed.includes('Name:')) {
              currentInteraction.contact_name = extractValue(trimmed);
            } else if (trimmed.includes('Channel:') || trimmed.includes('Method:')) {
              currentInteraction.channel = extractValue(trimmed);
            } else if (trimmed.includes('Amount:') || trimmed.includes('Requested:')) {
              currentInteraction.requested_amount = extractAmount(trimmed);
            } else if (trimmed.length > 20) {
              // Likely a summary or description
              currentInteraction.summary = trimmed;
              currentInteraction.status = 'completed';
            }
          });
          
          if (currentInteraction.contact_name || currentInteraction.summary) {
            parsedData.push(currentInteraction);
          }
        } else if (importType === 'clients') {
          // Try to parse client records
          parsedData = parseClientRecords(lines);
        }
      }

      setParsedData({
        type: importType as any,
        data: parsedData,
        preview: JSON.stringify(parsedData.slice(0, 3), null, 2)
      });
      
      setCurrentStep(2);
      
      toast({
        title: "File parsed successfully",
        description: `Found ${parsedData.length} records to import.`
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error parsing file",
        description: "Please check the file format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const extractDate = (text: string): string => {
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
  };

  const extractValue = (text: string): string => {
    const colonIndex = text.indexOf(':');
    return colonIndex > -1 ? text.substring(colonIndex + 1).trim() : text;
  };

  const extractAmount = (text: string): number => {
    const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
    return amountMatch ? parseFloat(amountMatch[1]) : 0;
  };

  const parseClientRecords = (lines: string[]): any[] => {
    // Simple client record parser
    const records: any[] = [];
    let currentRecord: any = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('Name:')) {
        if (currentRecord.first_name) records.push({...currentRecord});
        const name = extractValue(trimmed).split(' ');
        currentRecord = { 
          first_name: name[0] || '', 
          last_name: name.slice(1).join(' ') || '' 
        };
      } else if (trimmed.includes('Email:')) {
        currentRecord.email = extractValue(trimmed);
      } else if (trimmed.includes('Phone:')) {
        currentRecord.phone = extractValue(trimmed);
      } else if (trimmed.includes('Address:')) {
        currentRecord.address = extractValue(trimmed);
      }
    });
    
    if (currentRecord.first_name) records.push(currentRecord);
    return records;
  };

  const performImport = async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      for (const record of parsedData.data) {
        try {
          // Map fields based on user's field mapping
          const mappedRecord: any = {};
          Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
            if (targetField && record[sourceField]) {
              mappedRecord[targetField] = record[sourceField];
            }
          });

          // Add required fields based on import type
          if (parsedData.type === 'interactions') {
            mappedRecord.status = mappedRecord.status || 'completed';
            mappedRecord.channel = mappedRecord.channel || 'import';
            mappedRecord.occurred_at = mappedRecord.occurred_at || new Date().toISOString();
          }

          const { error } = await supabase
            .from(parsedData.type)
            .insert(mappedRecord);

          if (error) {
            errors.push(`Row ${successCount + 1}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (recordError: any) {
          errors.push(`Row ${successCount + 1}: ${recordError.message}`);
        }
      }

      setImportResults({ success: successCount, errors });
      setCurrentStep(4);

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} records.`,
        variant: errors.length > 0 ? "default" : "default"
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred during import.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFile(null);
    setParsedData(null);
    setImportType('');
    setFieldMapping({});
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Import Type & File</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {importTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.value}
                className={`cursor-pointer transition-colors ${
                  importType === type.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setImportType(type.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">{type.label}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2 mb-4">
            <p className="text-lg font-medium">Upload your file</p>
            <p className="text-sm text-muted-foreground">
              Supported formats: {supportedFormats.map(f => f.extension).join(', ')}
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.csv,.txt,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="mb-4"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
          
          {file && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={parseFile}
          disabled={!file || !importType || isProcessing}
        >
          {isProcessing ? "Processing..." : "Parse File"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (!parsedData) return null;
    
    const selectedType = importTypes.find(t => t.value === parsedData.type);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Preview & Map Fields</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Data Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="mb-2">Found <strong>{parsedData.data.length}</strong> records</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                    {parsedData.preview}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field Mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedData.data.length > 0 && Object.keys(parsedData.data[0]).map(sourceField => (
                  <div key={sourceField} className="flex items-center gap-3">
                    <Label className="w-24 text-xs truncate">{sourceField}</Label>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Select 
                      value={fieldMapping[sourceField] || ''} 
                      onValueChange={(value) => setFieldMapping(prev => ({...prev, [sourceField]: value}))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Map to..." />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="skip">Skip field</SelectItem>
                        {selectedType?.fields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            Back
          </Button>
          <Button onClick={() => setCurrentStep(3)}>
            Review Import
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review Import</h3>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Import Type:</span>
                <Badge>{importTypes.find(t => t.value === parsedData?.type)?.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Records to Import:</span>
                <Badge variant="secondary">{parsedData?.data.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Mapped Fields:</span>
                <Badge variant="secondary">{Object.values(fieldMapping).filter(Boolean).length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          Back
        </Button>
        <Button 
          onClick={performImport}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? "Importing..." : "Start Import"}
          <CheckCircle className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
        
        {importResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{importResults.errors.length}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </CardContent>
              </Card>
            </div>

            {importResults.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Import Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs space-y-1 max-h-32 overflow-auto">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-red-600">{error}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={resetWizard}>
          Import Another File
        </Button>
        <Button onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Wizard
          </DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 4 && <div className={`w-16 h-0.5 ${step < currentStep ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Select & Upload</span>
            <span>Preview & Map</span>
            <span>Review</span>
            <span>Complete</span>
          </div>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </DialogContent>
    </Dialog>
  );
};