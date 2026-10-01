"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../../components/navigation/Navbar";
import { Footer } from "../../../components/navigation/Footer";
import { ProtectedPage } from "../../../components/common/ProtectedPage";
import { CompactPageSearch } from "../../../components/admin/CompactPageSearch";
import { reportService } from "../../../services/reportService";

export default function AdminReports() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <ProtectedPage adminOnly>{() => <Reports />}</ProtectedPage>
      </main>
      <Footer />
    </div>
  );
}

function Reports() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        const data = await reportService.list({
          ...(status && { status }),
          ...(type && { reportType: type }),
        });
        if (!cancelled) setReports(data);
      } catch {
        if (!cancelled) setError("Unable to load reports.");
      }
    }

    loadReports();
    return () => { cancelled = true; };
  }, [status, type]);

  async function update(id, value) {
    try {
      await reportService.updateStatus(id, value);
      const data = await reportService.list({
        ...(status && { status }),
        ...(type && { reportType: type }),
      });
      setReports(data);
    } catch {
      setError("Unable to update report status.");
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredReports = normalizedSearch
    ? reports.filter((report) => [report.reportType, report.description, report.user?.name, report.bus?.busNumber, report.status].some((value) => String(value || "").toLowerCase().includes(normalizedSearch)))
    : reports;

  return <>
    <header className="flex items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--primary-ink)]">Administration</p><h1 className="mt-2 text-3xl font-bold">Incident reports</h1></div>
      <CompactPageSearch label="Search reports" placeholder="Type, description, passenger, or bus" value={search} onChange={setSearch} />
    </header>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <select className="field-input" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="">All statuses</option><option value="open">Open</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option>
      </select>
      <select className="field-input" value={type} onChange={(event) => setType(event.target.value)}>
        <option value="">All types</option><option value="condition">Condition</option><option value="safety">Safety</option>
      </select>
    </div>
    {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
    <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--background)] text-[var(--muted)]"><tr><th className="p-4">Report</th><th className="p-4">Passenger</th><th className="p-4">Bus</th><th className="p-4">Status</th></tr></thead>
        <tbody>{filteredReports.map((report) => <tr key={report._id} className="border-t border-[var(--border)]"><td className="p-4"><strong className="capitalize">{report.reportType}</strong><p className="mt-1 max-w-md text-[var(--muted)]">{report.description}</p></td><td className="p-4">{report.user?.name || "Unavailable"}</td><td className="p-4">{report.bus?.busNumber || "Unavailable"}</td><td className="p-4"><select className="rounded-lg border border-[var(--border)] p-2 capitalize" value={report.status} onChange={(event) => update(report._id, event.target.value)}><option value="open">Open</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option></select></td></tr>)}</tbody>
      </table>
      {!filteredReports.length && <p className="p-5 text-sm text-[var(--muted)]">No reports found.</p>}
    </div>
  </>;
}