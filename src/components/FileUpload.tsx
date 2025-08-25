
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';
import initSqlJs from 'sql.js';

// CSV helpers
const csvEscape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
const toHex = (u8: Uint8Array) => Array.from(u8).map(b => b.toString(16).padStart(2,'0')).join('');
const formatCsvValue = (val: any): string => {
  if (val == null) return '';
  if (val instanceof Uint8Array) return csvEscape('0x' + toHex(val));
  if (typeof val === 'string') return csvEscape(val);
  if (typeof val === 'number' || typeof val === 'boolean') return csvEscape(String(val));
  return csvEscape(JSON.stringify(val));
};

interface FileUploadProps {
  onFileProcessed: (csvData: string, fileName: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processGpkgFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      console.log('Starting GPKG processing for file:', file.name, 'Size:', file.size);
      setProgress(10);

      const arrayBuffer = await file.arrayBuffer();
      console.log('File read as ArrayBuffer, size:', arrayBuffer.byteLength);
      setProgress(20);

      // Initialize SQL.js with CDN fallback
      let SQL;
      try {
        SQL = await initSqlJs({
          locateFile: (f) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/${f}`
        });
      } catch (sqlError) {
        console.error('Primary CDN failed, trying backup:', sqlError);
        SQL = await initSqlJs({
          locateFile: (f) => `https://sql.js.org/dist/${f}`
        });
      }
      console.log('SQL.js initialized successfully');
      setProgress(30);

      const db = new SQL.Database(new Uint8Array(arrayBuffer));
      console.log('Database created from ArrayBuffer');
      setProgress(40);

      // Get all tables except SQLite internals
      const tables: string[] = [];
      let tblStmt;
      try {
        tblStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'gpkg_%' AND name NOT LIKE 'rtree_%'");
        while (tblStmt.step()) {
          const row = tblStmt.getAsObject() as Record<string, any>;
          if (typeof row.name === 'string') {
            tables.push(row.name);
            console.log('Found table:', row.name);
          }
        }
      } catch (tableError) {
        console.error('Error querying tables:', tableError);
        throw new Error('Failed to read database structure');
      } finally {
        if (tblStmt) tblStmt.free();
      }

      console.log('Total tables found:', tables.length);
      setProgress(50);

      if (tables.length === 0) {
        throw new Error('No data tables found in GeoPackage. File may be empty or corrupted.');
      }

      // Build union of all column names across tables
      const allColumns: string[] = [];
      const colSet = new Set<string>();
      for (const t of tables) {
        let colStmt;
        try {
          colStmt = db.prepare(`PRAGMA table_info("${t}")`);
          while (colStmt.step()) {
            const col = colStmt.getAsObject() as any;
            const name = col.name as string;
            if (name && !colSet.has(name)) {
              colSet.add(name);
              allColumns.push(name);
            }
          }
        } catch (colError) {
          console.error(`Error reading columns for table ${t}:`, colError);
        } finally {
          if (colStmt) colStmt.free();
        }
      }

      console.log('Total unique columns found:', allColumns.length);
      setProgress(60);

      // CSV header: table + unioned columns
      const header = ['table', ...allColumns];
      const lines: string[] = [header.map(csvEscape).join(',')];

      let processedTables = 0;
      let totalRows = 0;
      
      for (const t of tables) {
        let stmt;
        try {
          stmt = db.prepare(`SELECT * FROM "${t}"`);
          let tableRows = 0;
          while (stmt.step()) {
            const obj = stmt.getAsObject() as Record<string, any>;
            const rowValues = [csvEscape(t), ...allColumns.map((c) => formatCsvValue(obj[c]))];
            lines.push(rowValues.join(','));
            tableRows++;
            totalRows++;
          }
          console.log(`Table ${t}: ${tableRows} rows processed`);
        } catch (dataError) {
          console.error(`Error reading data from table ${t}:`, dataError);
        } finally {
          if (stmt) stmt.free();
        }
        
        processedTables++;
        setProgress(60 + Math.round((processedTables / tables.length) * 30));
        await new Promise((r) => setTimeout(r, 0));
      }

      console.log(`Total rows processed: ${totalRows}`);
      setProgress(95);

      const csv = lines.join('\n');
      const fileName = file.name.replace(/\.gpkg$/i, '') + '_all_tables.csv';
      
      console.log(`CSV generated: ${lines.length} lines total`);
      setProgress(100);
      
      onFileProcessed(csv, fileName);

    } catch (err) {
      console.error('GPKG processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to process GPKG: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      console.log('File dropped:', file.name, 'Type:', file.type, 'Size:', file.size);
      processGpkgFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/geopackage+sqlite3': ['.gpkg'],
      'application/octet-stream': ['.gpkg']
    },
    multiple: false
  });

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center space-y-4 py-12 cursor-pointer transition-all duration-300",
            isDragActive && "scale-105 bg-primary/10"
          )}
        >
          <input {...getInputProps()} />
          
          {!isProcessing ? (
            <>
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragActive ? 'Drop your GPKG file here' : 'Upload GPKG File'}
                </h3>
                <p className="text-muted-foreground">
                  Drag and drop your GeoPackage file or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports .gpkg files up to 100MB
                </p>
              </div>
              <Button variant="upload" size="lg">
                <FileType className="h-4 w-4" />
                Choose File
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-primary/10">
                <FileType className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="text-center space-y-4 w-full max-w-md">
                <h3 className="text-lg font-semibold">Processing GPKG File...</h3>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
              </div>
            </>
          )}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
