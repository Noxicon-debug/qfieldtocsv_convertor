import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DownloadSection } from '@/components/DownloadSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Database, FileSpreadsheet } from 'lucide-react';

const Index = () => {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileProcessed = (data: string, name: string) => {
    setCsvData(data);
    setFileName(name);
  };

  const handleReset = () => {
    setCsvData(null);
    setFileName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center space-x-2 text-primary">
                <Database className="h-8 w-8" />
                <span className="text-2xl font-bold">→</span>
                <FileSpreadsheet className="h-8 w-8" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            GPKG to CSV Converter
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Convert GeoPackage files to CSV format for QField compatibility
          </p>
          
          <div className="flex justify-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>QField Ready</span>
            </Badge>
            <Badge variant="outline">Fast Processing</Badge>
            <Badge variant="outline">Secure</Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {!csvData ? (
            <FileUpload onFileProcessed={handleFileProcessed} />
          ) : (
            <DownloadSection 
              csvData={csvData} 
              fileName={fileName} 
              onReset={handleReset} 
            />
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <div className="p-1 rounded bg-primary/10">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <span>Supported Formats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Processes .gpkg (GeoPackage) files containing vector data, tables, and spatial information.
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <div className="p-1 rounded bg-accent/10">
                    <FileSpreadsheet className="h-4 w-4 text-accent" />
                  </div>
                  <span>CSV Output</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Exports data in CSV format with all attributes preserved for easy import into QField.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <div className="p-1 rounded bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span>QField Compatible</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Output files are optimized for direct use in QField mobile GIS applications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
