"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import FloralCorner, { FloralSprig, FloralGarland } from "@/components/FloralCorner";
import type { BankAccount } from "@/types";

interface Props {
  qrUrl?: string;
  bankAccounts?: BankAccount[];
  // Legacy single bank (backward compat)
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export default function GiftRegistry({ qrUrl, bankAccounts, bankName, bankAccountNumber, bankAccountName }: Props) {
  const { t } = useLanguage();

  // Merge: prefer bank_accounts_json, fall back to legacy single bank
  const accounts: BankAccount[] = (bankAccounts && bankAccounts.length > 0)
    ? bankAccounts
    : (bankName || bankAccountNumber || bankAccountName)
      ? [{ bank_name: bankName ?? "", account_number: bankAccountNumber ?? "", account_name: bankAccountName ?? "" }]
      : [];

  const hasBankDetails = accounts.length > 0;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (accountNumber: string, idx: number) => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <section id="gift" className="relative isolate py-20 px-4 bg-[#fffbf5] overflow-hidden">
      {/* Corner flowers sit behind the content */}
      <FloralCorner variant="burgundy" position="top-left" size={140} opacity={0.6} className="!-z-10" />
      <FloralCorner variant="burgundy" position="top-right" size={140} opacity={0.6} className="!-z-10" />
      <FloralGarland variant="burgundy" height={150} opacity={0.6} className="!-z-10" />
      <div className="relative max-w-xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] mb-3 font-[family-name:var(--font-lato)]">
          {t("gift_eyebrow")}
        </p>
        <h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-wedding)] text-[#3a3028] mb-4">
          A Gift of Love
        </h2>
        <div className="flex items-center justify-center gap-3 text-[var(--color-gold)] opacity-70 mb-6">
          <span className="block h-px w-10 bg-current" />
          <FloralSprig size={52} />
          <span className="block h-px w-10 bg-current" />
        </div>
        <p className="text-[#9a7d5a] font-[family-name:var(--font-lato)] mb-10 leading-relaxed">
          {t("gift_desc")}
        </p>

        <div className={`flex flex-col ${qrUrl && hasBankDetails ? "sm:flex-row" : ""} items-center justify-center gap-8`}>
          {/* QR Code */}
          {qrUrl && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs uppercase tracking-widest text-[#9a7d5a] font-[family-name:var(--font-lato)]">{t("gift_scan")}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="Payment QR Code"
                className="w-48 h-48 object-contain rounded-2xl border border-[var(--color-gold-light)] shadow-sm"
              />
            </div>
          )}

          {/* Divider */}
          {qrUrl && hasBankDetails && (
            <div className="hidden sm:flex flex-col items-center gap-2 self-stretch justify-center">
              <div className="w-px flex-1 bg-[var(--color-gold-light)]" />
              <span className="text-xs text-[#c9b99a] font-[family-name:var(--font-lato)]">{t("gift_or")}</span>
              <div className="w-px flex-1 bg-[var(--color-gold-light)]" />
            </div>
          )}
          {qrUrl && hasBankDetails && (
            <div className="sm:hidden w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--color-gold-light)]" />
              <span className="text-xs text-[#c9b99a] font-[family-name:var(--font-lato)]">{t("gift_or")}</span>
              <div className="flex-1 h-px bg-[var(--color-gold-light)]" />
            </div>
          )}

          {/* Bank Transfer */}
          {hasBankDetails && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs uppercase tracking-widest text-[#9a7d5a] font-[family-name:var(--font-lato)]">{t("gift_bank")}</p>
              {accounts.map((acc, idx) => (
                <div key={idx} className="glass rounded-2xl px-8 py-6 space-y-3 min-w-[200px]">
                  {acc.bank_name && (
                    <div>
                      <p className="text-xs text-[#c9b99a] uppercase tracking-wider font-[family-name:var(--font-lato)]">Bank</p>
                      <p className="text-[#3a3028] font-semibold font-[family-name:var(--font-lato)]">{acc.bank_name}</p>
                    </div>
                  )}
                  {acc.account_number && (
                    <div>
                      <p className="text-xs text-[#c9b99a] uppercase tracking-wider font-[family-name:var(--font-lato)]">{t("gift_acc_num")}</p>
                      <div className="flex items-center justify-center gap-2 mt-0.5">
                        <p className="text-[#3a3028] font-semibold font-[family-name:var(--font-lato)] text-lg tracking-widest">{acc.account_number}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(acc.account_number, idx)}
                          title="Copy account number"
                          className="text-[var(--color-gold)] hover:text-[var(--color-gold-hover)] transition-colors shrink-0"
                        >
                          {copiedIdx === idx ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {copiedIdx === idx && <p className="text-xs text-[var(--color-gold)] mt-0.5 font-[family-name:var(--font-lato)]">{t("gift_copied")}</p>}
                    </div>
                  )}
                  {acc.account_name && (
                    <div>
                      <p className="text-xs text-[#c9b99a] uppercase tracking-wider font-[family-name:var(--font-lato)]">{t("gift_acc_name")}</p>
                      <p className="text-[#3a3028] font-semibold font-[family-name:var(--font-lato)]">{acc.account_name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

