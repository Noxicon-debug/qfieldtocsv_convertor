import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, CheckCircle, RotateCcw, Save, Database } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface DownloadSectionProps {
  csvData: string;
  fileName: string;
  onReset: () => void;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  csvData,
  fileName,
  onReset
}) => {
  const downloadCsv = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveLocally = () => {
    try {
      localStorage.setItem(`gpkg_csv_${fileName}`, csvData);
      localStorage.setItem(`gpkg_csv_${fileName}_timestamp`, new Date().toISOString());
      toast.success('Data saved locally!', {
        description: 'Your CSV data has been saved to browser storage.'
      });
    } catch (error) {
      toast.error('Failed to save locally', {
        description: 'Browser storage may be full or unavailable.'
      });
    }
  };

  const sendToServer = async () => {
    try {
      // This is a placeholder - you'll need to implement your actual server endpoint
      const response = await fetch('/api/save-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          csvData,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success('Data sent to server!', {
          description: 'Your CSV data has been saved to the database.'
        });
      } else {
        throw new Error('Server responded with error');
      }
    } catch (error) {
      toast.error('Failed to send to server', {
        description: 'Please check your connection and try again.'
      });
    }
  };

  const previewData = csvData.split('\n').slice(0, 5).join('\n');

  return (
    <Card className="border border-accent/20 bg-gradient-to-br from-card to-accent/5">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-accent/10">
            <CheckCircle className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Conversion Complete!</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your GPKG file has been successfully converted to CSV
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Info */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{fileName}</p>
              <p className="text-sm text-muted-foreground">
                {csvData.split('\n').length - 1} records exported
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={downloadCsv} variant="hero" size="lg">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Save Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Save Options</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={saveLocally} variant="outline" className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Locally</span>
            </Button>
            <Button onClick={sendToServer} variant="outline" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Send to Server</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Save locally stores data in your browser. Send to server saves to a remote database.
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Preview (First 5 rows)</h4>
          <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
              {previewData}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-3">
          <Button onClick={onReset} variant="outline" className="flex items-center space-x-2">
            <RotateCcw className="h-4 w-4" />
            <span>Reset & Convert Another</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};