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
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    subjects: number;
    termInfo: string;
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
    formData.append("replace", "true");

    try {
      const res = await fetch("/api/timetable/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUploadResult(data);
      setMessage(
        `Success! ${data.created} lectures and ${data.subjects} subjects loaded.`
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
        <h1 className="text-2xl font-bold text-white">Timetable Upload</h1>
        <p className="text-zinc-400">
          Upload your Term 4 Excel timetable (e.g. TERM 4 MBA-MKT TT.xlsx)
        </p>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <div className="mb-4 flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-cyan-400" />
          <div>
            <h2 className="font-semibold text-white">Upload Excel Timetable</h2>
            <p className="text-sm text-zinc-400">
              Supports TAPMI format: TERM 4 MBA-MKT TT.xlsx
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-black/30 px-6 py-10 transition hover:border-cyan-500/40 hover:bg-cyan-500/5">
          <Upload className="mb-3 h-10 w-10 text-zinc-500" />
          <p className="text-sm text-zinc-300">
            {file ? file.name : "Click to select .xlsx file"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
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

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          <p className="mb-2 font-medium text-zinc-300">Auto-detected from your file:</p>
          <ul className="list-inside list-disc space-y-1 text-xs">
            <li>Subjects with credits (MSM 6400, 6430, 6503, etc.)</li>
            <li>Daily lecture slots (8:45 AM – 8:30 PM)</li>
            <li>Faculty names and G2 classroom venue</li>
          </ul>
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
                ? "text-emerald-400"
                : "text-cyan-300"
            }`}
          >
            {message}
          </p>
        )}

        {uploadResult && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Upload complete</span>
            </div>
            <p className="mt-2 text-sm text-emerald-200/80">
              {uploadResult.termInfo}
            </p>
            <p className="mt-1 text-sm text-emerald-200/80">
              {uploadResult.created} lectures · {uploadResult.subjects} subjects
            </p>
          </div>
        )}
      </div>
    </NavShell>
  );
}
