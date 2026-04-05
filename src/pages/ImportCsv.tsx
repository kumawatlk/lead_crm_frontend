import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CSV_COLUMNS } from '@/types/lead';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

type ImportStep = 'upload' | 'preview' | 'success';

const ImportCsv: React.FC = () => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mappings, setMappings] = useState<Record<number, string>>({});
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importResult, setImportResult] = useState({ imported: 0, skipped: 0, failed: 0 });
  const navigate = useNavigate();
  const { token } = useAuth();

  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values.map((v) => v.replace(/^"|"$/g, '').trim());
  };

  const parseCsvText = (content: string) => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    return lines.map(parseCsvLine);
  };

  const parseSpreadsheetFile = async (file: File): Promise<string[][]> => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      const content = await file.text();
      return parseCsvText(content);
    }

    if (fileName.endsWith('.xlsx')) {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
        header: 1,
        raw: false,
        defval: '',
      });
      return rows
        .map((row) => row.map((cell) => String(cell ?? '').trim()))
        .filter((row) => row.some((cell) => cell.length > 0));
    }

    throw new Error('Only .csv and .xlsx files are supported');
  };

  const simulateUpload = (name: string, parsedRows: string[][]) => {
    setFileName(name);
    setRows(parsedRows);
    setHeaders(parsedRows[0] || []);
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          // Auto-map columns
          const autoMap: Record<number, string> = {};
          CSV_COLUMNS.forEach((col, i) => { autoMap[i] = col; });
          setMappings(autoMap);
          setStep('preview');
          return 100;
        }
        return p + 20;
      });
    }, 300);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx'))) {
      const parsedRows = await parseSpreadsheetFile(file);
      simulateUpload(file.name, parsedRows);
    }
  }, [parseSpreadsheetFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const parsedRows = await parseSpreadsheetFile(file);
      simulateUpload(file.name, parsedRows);
    }
  };

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

  const findColumnIndex = (sourceHeaders: string[], aliases: string[]) => {
    const normalizedHeaders = sourceHeaders.map(normalize);
    for (const alias of aliases) {
      const target = normalize(alias);
      const exactIdx = normalizedHeaders.findIndex((h) => h === target);
      if (exactIdx >= 0) return exactIdx;
      const partialIdx = normalizedHeaders.findIndex((h) => h.includes(target) || target.includes(h));
      if (partialIdx >= 0) return partialIdx;
    }
    return -1;
  };

  const splitTags = (value: string) =>
    value
      .split(/[;,|]/g)
      .map((tag) => tag.trim())
      .filter(Boolean);

  const handleImport = async () => {
    if (!token) return;
    if (rows.length < 2) return;

    const idx = {
      companyName: findColumnIndex(headers, ['companyName', 'company name', 'name', 'business name']),
      phone: findColumnIndex(headers, ['phone', 'phone number', 'mobile', 'contact']),
      email: findColumnIndex(headers, ['email', 'emails', 'mail']),
      address: findColumnIndex(headers, ['address', 'full address']),
      city: findColumnIndex(headers, ['city']),
      state: findColumnIndex(headers, ['state']),
      pincode: findColumnIndex(headers, ['pincode', 'pin', 'postal', 'zipcode', 'zip']),
      category: findColumnIndex(headers, ['category', 'business category']),
      leadStatus: findColumnIndex(headers, ['leadStatus', 'lead status', 'status']),
      tags: findColumnIndex(headers, ['tags', 'tag']),
      notes: findColumnIndex(headers, ['notes', 'note', 'remarks']),
      website: findColumnIndex(headers, ['website', 'site', 'url']),
    };

    const get = (row: string[], key: keyof typeof idx) => (idx[key] >= 0 ? (row[idx[key]] || '').trim() : '');

    const payload = rows.slice(1).map((row) => {
      const companyName = get(row, 'companyName');
      const category = get(row, 'category');
      const website = get(row, 'website');
      const rawTags = get(row, 'tags');
      const tags = rawTags
        ? splitTags(rawTags)
        : Array.from(new Set(['Imported', ...(category ? [category] : [])]));
      const notes = [get(row, 'notes'), website ? `Website: ${website}` : ''].filter(Boolean).join(' | ');

      return {
        companyName,
        phone: get(row, 'phone'),
        email: get(row, 'email'),
        address: get(row, 'address'),
        city: get(row, 'city'),
        state: get(row, 'state'),
        pincode: get(row, 'pincode'),
        category,
        leadStatus: get(row, 'leadStatus') || 'New',
        tags,
        notes,
      };
    });

    const result = await api.importLeads(token, payload);
    setImportResult(result);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-soft text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">CSV Imported Successfully!</h2>
          <p className="text-muted-foreground">Your leads have been imported and are ready to manage.</p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Total Imported', value: String(importResult.imported), color: 'text-primary' },
              { label: 'Skipped', value: String(importResult.skipped), color: 'text-warning' },
              { label: 'Failed', value: String(importResult.failed), color: 'text-destructive' },
            ].map((s) => (
              <div key={s.label} className="bg-secondary rounded-xl p-4">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <Button onClick={() => navigate('/leads')} className="gap-2">
              View Imported Leads <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => { setStep('upload'); setFileName(''); setProgress(0); }} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Import Another CSV
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* File info */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{fileName}</p>
            <p className="text-sm text-muted-foreground">{Math.max(rows.length - 1, 0)} rows preview • {headers.length} columns detected</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { setStep('upload'); setFileName(''); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* CSV Preview */}
        <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">CSV Preview</h3>
            <p className="text-sm text-muted-foreground">Showing first 5 rows</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  {(headers.length > 0 ? headers : CSV_COLUMNS).map((col) => (
                    <th key={col} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1, 6).map((row, i) => (
                  <tr key={i} className="border-t border-border hover:bg-secondary/50">
                    {(headers.length > 0 ? headers : CSV_COLUMNS).map((_, j) => (
                      <td key={j} className="px-4 py-3 whitespace-nowrap text-foreground">{row[j] || ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column Mapping */}
        <div className="bg-card rounded-2xl border border-border shadow-soft p-5">
          <h3 className="font-semibold text-foreground mb-4">Column Mapping</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CSV_COLUMNS.map((col, i) => (
              <div key={col} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  {col}
                  {i < 4 && <span className="text-destructive">*</span>}
                </label>
                <select
                  value={mappings[i] || ''}
                  onChange={(e) => setMappings({ ...mappings, [i]: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select column...</option>
                  {CSV_COLUMNS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Import Summary */}
        <div className="bg-card rounded-2xl border border-border shadow-soft p-5">
          <h3 className="font-semibold text-foreground mb-3">Import Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Rows', value: String(Math.max(rows.length - 1, 0)), color: 'text-foreground' },
              { label: 'Valid Rows', value: String(Math.max(rows.length - 1, 0)), color: 'text-emerald-600' },
              { label: 'Invalid Rows', value: '0', color: 'text-destructive' },
              { label: 'Duplicates', value: '0', color: 'text-warning' },
            ].map((s) => (
              <div key={s.label} className="bg-secondary rounded-xl p-3 text-center">
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Validation warnings */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Review before importing</p>
              <p className="text-amber-700 text-xs mt-0.5">Ensure required columns are present and formatted correctly.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { setStep('upload'); setFileName(''); }}>Cancel</Button>
          <Button onClick={handleImport} className="gap-2">
            Import {Math.max(rows.length - 1, 0)} Leads <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Upload step
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Import CSV File</h2>
        <p className="text-muted-foreground">Upload your leads data in CSV or XLSX format to get started.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "bg-card rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 shadow-soft",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="font-medium text-foreground">{fileName}</p>
            <div className="w-full max-w-xs mx-auto bg-secondary rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">Uploading... {progress}%</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Drop CSV/XLSX file here or browse</p>
              <p className="text-sm text-muted-foreground mt-1">Accepted formats: .csv, .xlsx</p>
            </div>
            <label>
              <input type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="hidden" />
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        )}
      </div>

      {fileName && !uploading && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-soft flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground flex-1 truncate">{fileName}</span>
          <Button variant="ghost" size="icon" onClick={() => setFileName('')}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImportCsv;
