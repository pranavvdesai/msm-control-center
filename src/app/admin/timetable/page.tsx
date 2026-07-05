"use client";

import { useEffect, useState } from "react";
import { NavShell } from "@/components/NavShell";
import { GlowButton } from "@/components/GlowButton";
import { Upload, FileSpreadsheet, CheckCircle } from "lucide-react";

export default function AdminTimetablePage() {
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [canUpload, setCanUpload] = useState(false);
  const [canAdmin, setCanAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [replaceAll, setReplaceAll] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    subjects: number;
    termInfo: string;
    replacedDates?: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUserName(d.user?.name || "");
        setCanUpload(!!d.user?.canUpload);
        setCanAdmin(!!d.user?.canAdmin);
      });
  }, []);

  async function uploadExcel() {
    if (!file) {
      setMessage("Please select an Excel file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (replaceAll) formData.append("replaceAll", "true");

    try {
      const res = await fetch("/api/timetable/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUploadResult(data);
      setMessage(
        replaceAll
          ? `Success! Full timetable replaced — ${data.created} lectures loaded.`
          : `Success! ${data.created} lectures added for ${data.replacedDates ?? "the uploaded"} day(s). Older months were kept.`
      );
      setFile(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed");
    }
    setLoading(false);
  }

  if (!canUpload) {
    return (
      <NavShell userName={userName}>
        <p className="text-red-400">Upload access is restricted to Ram and Bhavya only.</p>
      </NavShell>
    );
  }

  return (
    <NavShell userName={userName} canUpload canAdmin={canAdmin} isAdmin>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Timetable Upload</h1>
        <p className="text-slate-600">
          Upload monthly Excel timetables (e.g. TERM 4 MBA-MKT TT.xlsx). New uploads merge in — older months stay unless you choose full replace.
        </p>
      </div>

      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-cyan-700" />
          <div>
            <h2 className="font-semibold text-slate-900">Upload Excel Timetable</h2>
            <p className="text-sm text-slate-600">
              Supports TAPMI format: TERM 4 MBA-MKT TT.xlsx
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 transition hover:border-cyan-400 hover:bg-cyan-50">
          <Upload className="mb-3 h-10 w-10 text-slate-500" />
          <p className="text-sm text-slate-700">
            {file ? file.name : "Click to select .xlsx file"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Date, time slots, and MSM subject codes are auto-detected
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setMessage("");
              setUploadResult(null);
            }}
          />
        </label>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="mb-2 font-medium text-slate-700">How uploads work:</p>
          <ul className="list-inside list-disc space-y-1 text-xs">
            <li>Default: only dates in the new file are updated — previous months remain</li>
            <li>Re-uploading July updates July only; June stays visible in Timetable</li>
            <li>Subjects, slots, faculty, and G2 room are auto-detected from Excel</li>
          </ul>
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={replaceAll}
              onChange={(e) => setReplaceAll(e.target.checked)}
              className="mt-1"
            />
            <span>
              Replace entire timetable
              <span className="block text-xs font-normal text-slate-500">
                Deletes all existing lectures before importing — use only for a fresh full-term file
              </span>
            </span>
          </label>
        </div>

        <GlowButton
          className="mt-4 w-full"
          onClick={uploadExcel}
          disabled={loading || !file}
        >
          {loading ? "Parsing & uploading..." : "Upload Timetable"}
        </GlowButton>

        {message && (
          <p
            className={`mt-3 text-sm ${
              message.startsWith("Success") || message.includes("uploaded")
                ? "text-emerald-700"
                : "text-cyan-700"
            }`}
          >
            {message}
          </p>
        )}

        {uploadResult && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Upload complete</span>
            </div>
            <p className="mt-2 text-sm text-emerald-800">
              {uploadResult.termInfo}
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              {uploadResult.created} lectures · {uploadResult.subjects} subjects
            </p>
          </div>
        )}
      </div>
    </NavShell>
  );
}
