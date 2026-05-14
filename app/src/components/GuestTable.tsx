"use client";

import { useState } from "react";
import type { Guest } from "@/types";

const statusBadge = (attending: boolean | undefined) => {
  if (attending === true) return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Attending</span>;
  if (attending === false) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Declined</span>;
  return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">Pending</span>;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SendEmailButton({ guest }: { guest: Guest }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!guest.email || !guest.attending) return <span className="text-gray-300 text-xs">—</span>;

  const handleSend = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") return <span className="text-green-600 text-xs font-medium">✅ Sent</span>;
  if (status === "error") return <span className="text-red-500 text-xs">Failed</span>;

  return (
    <button
      onClick={handleSend}
      disabled={status === "sending"}
      className="text-xs px-2 py-1 rounded bg-[var(--color-gold)] text-white hover:bg-[var(--color-gold-hover)] disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {status === "sending" ? "Sending…" : "Send Pass"}
    </button>
  );
}

function WhatsAppButton({ guest }: { guest: Guest }) {
  if (!guest.attending || !guest.phone_number) return <span className="text-gray-300 text-xs">—</span>;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const passUrl = `${appUrl}/pass?token=${guest.token}`;
  const text = encodeURIComponent(`Hi ${guest.name.split(" ")[0]}! Here is your wedding entry pass: ${passUrl}`);
  const phone = guest.phone_number.replace(/\D/g, "");
  const waUrl = `https://wa.me/${phone}?text=${text}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs px-2 py-1 rounded bg-[#25d366] text-white hover:bg-[#1da851] transition-colors whitespace-nowrap inline-block"
    >
      WhatsApp
    </a>
  );
}

function DeleteButton({ guestId, guestName, onDeleted }: { guestId: string; guestName: string; onDeleted: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/guests/${guestId}`, { method: "DELETE" });
      if (res.ok) onDeleted(guestId);
    } catch {
      // silently fail — button resets
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 whitespace-nowrap">Delete {guestName.split(" ")[0]}?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {deleting ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs px-2 py-1 rounded border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap"
    >
      Remove
    </button>
  );
}

export default function GuestTable({ guests: initialGuests }: { guests: Guest[] }) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [search, setSearch] = useState("");

  const handleDeleted = (id: string) =>
    setGuests((prev) => prev.filter((g) => g.id !== id));

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.email ?? "").toLowerCase().includes(q) ||
      (g.group_name ?? "").toLowerCase().includes(q) ||
      (g.side ?? "").toLowerCase().includes(q)
    );
  });

  if (guests.length === 0) {
    return (
      <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">
        No RSVPs yet. Share your invitation link to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email, group, or side…"
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[var(--color-gold)] bg-white shadow-sm"
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-400 text-sm">No guests match your search.</div>
        )}

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filtered.map((g) => (
            <div key={g.id} className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{g.name}</span>
                {statusBadge(g.attending)}
              </div>
              {g.plus_one_name && <p className="text-xs text-gray-500">+1: {g.plus_one_name}</p>}
              {g.group_name && <p className="text-xs text-gray-500">Group: {g.group_name}</p>}
              {g.side && <p className="text-xs text-gray-500 capitalize">Side: {g.side}</p>}
              {g.email && <p className="text-xs text-gray-400">{g.email}</p>}
              {g.phone_number && <p className="text-xs text-gray-400">{g.phone_number}</p>}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">{formatDate(g.submitted_at)}</span>
                <div className="flex items-center gap-2">
                  <SendEmailButton guest={g} />
                  <WhatsAppButton guest={g} />
                  <DeleteButton guestId={g.id} guestName={g.name} onDeleted={handleDeleted} />
                </div>
              </div>
              {g.checked_in && <span className="text-xs text-green-600 font-medium">✅ Checked In</span>}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Email", "Phone", "Status", "+1", "Group", "Side", "Message", "Submitted", "Checked In", "Pass", "WhatsApp", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{g.name}</td>
                  <td className="px-4 py-3 text-gray-500">{g.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{g.phone_number ?? "—"}</td>
                  <td className="px-4 py-3">{statusBadge(g.attending)}</td>
                  <td className="px-4 py-3 text-gray-500">{g.plus_one_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{g.group_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{g.side ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{g.message ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(g.submitted_at)}</td>
                  <td className="px-4 py-3">
                    {g.checked_in ? (
                      <span className="text-green-600 font-medium">✅ Yes</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SendEmailButton guest={g} />
                  </td>
                  <td className="px-4 py-3">
                    <WhatsAppButton guest={g} />
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton guestId={g.id} guestName={g.name} onDeleted={handleDeleted} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
