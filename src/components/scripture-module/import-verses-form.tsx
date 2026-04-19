"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { importScriptureVerses } from "@/app/actions/scripture-module";
import type { ParsedImportLine } from "@/lib/scripture-module/import-parse";
import { parseCsvToImportLines } from "@/lib/scripture-module/parse-csv-to-verses";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE = `Romans 12:2 | ESV | Do not be conformed to this world, but be transformed by the renewal of your mind.
Joshua 1:9 | NIV | Have I not commanded you? Be strong and courageous. | Courage`;

export function ImportVersesForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    failed: { line: number; message: string }[];
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvLines, setCsvLines] = useState<ParsedImportLine[] | null>(null);
  const [csvClientError, setCsvClientError] = useState<string | null>(null);
  const [csvParsing, setCsvParsing] = useState(false);

  function clearCsv() {
    setCsvFileName(null);
    setCsvLines(null);
    setCsvClientError(null);
    setCsvParsing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function onCsvSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      clearCsv();
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvFileName(null);
      setCsvLines(null);
      setCsvParsing(false);
      setCsvClientError("Please choose a .csv file.");
      return;
    }
    setCsvFileName(file.name);
    setCsvClientError(null);
    setCsvLines(null);
    setCsvParsing(true);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      startTransition(() => {
        const out = parseCsvToImportLines(text);
        setCsvParsing(false);
        if (!out.ok) {
          setCsvLines(null);
          setCsvClientError(out.message);
          return;
        }
        setCsvLines(out.lines);
        setCsvClientError(null);
      });
    };
    reader.onerror = () => {
      setCsvParsing(false);
      setCsvLines(null);
      setCsvClientError("Could not read the file.");
    };
    reader.readAsText(file);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setResult(null);

    if (csvParsing) {
      setError("Still parsing the CSV file…");
      return;
    }

    if (csvClientError && csvFileName) {
      setError(csvClientError);
      return;
    }

    startTransition(async () => {
      const fd = new FormData(form);
      if (csvLines && csvLines.length > 0) {
        fd.set("parsedJson", JSON.stringify(csvLines));
        fd.delete("bulk");
      } else {
        fd.delete("parsedJson");
      }

      const res = await importScriptureVerses(fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setResult({ imported: res.imported, failed: res.failed });
      form.reset();
      clearCsv();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        One verse per line. Columns separated by <code className="rounded bg-muted px-1">|</code>:
        Reference, Translation, Verse text, optional list name. Blank lines are ignored. Verse text
        cannot contain <code className="rounded bg-muted px-1">|</code> in this version.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="csv-upload">Upload CSV file</Label>
          <input
            id="csv-upload"
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="block w-full max-w-md text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
            onChange={onCsvSelected}
            disabled={pending || csvParsing}
          />
          <p className="text-xs text-muted-foreground">
            Upload a CSV file with columns: Reference | Translation | Verse Text | Optional List Name
            (pipe- or comma-separated; delimiter is detected automatically).
          </p>
          {csvFileName ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                Selected: <span className="font-medium text-foreground">{csvFileName}</span>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={clearCsv} disabled={pending}>
                Clear file
              </Button>
            </div>
          ) : null}
          {csvClientError ? (
            <p className="text-sm text-destructive" role="alert">
              {csvClientError}
            </p>
          ) : null}
          {csvLines && csvLines.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Ready to import {csvLines.filter((l) => l.ok).length} verse(s)
              {csvLines.some((l) => !l.ok)
                ? ` (${csvLines.filter((l) => !l.ok).length} row(s) will be reported as failed)`
                : ""}
              .
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk">Paste lines to import</Label>
          <Textarea
            id="bulk"
            name="bulk"
            rows={12}
            className="font-mono text-sm"
            placeholder={EXAMPLE}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {result ? (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <p className="font-medium text-foreground">Imported {result.imported} verse(s).</p>
            {result.failed.length > 0 ? (
              <p className="mt-1 text-muted-foreground">
                {result.failed.length} row(s) failed (see below).
              </p>
            ) : null}
            {result.failed.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                {result.failed.map((f) => (
                  <li key={`${f.line}-${f.message}`}>
                    Line {f.line}: {f.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-muted-foreground">All lines processed successfully.</p>
            )}
          </div>
        ) : null}
        <Button type="submit" disabled={pending || csvParsing}>
          {pending ? "Importing…" : csvParsing ? "Reading CSV…" : "Import"}
        </Button>
      </form>
    </div>
  );
}
