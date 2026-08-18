import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { Reconciliation, Email } from "./types";

const DATA = path.join(process.cwd(), "data");

export const getReconciliation = cache((): Reconciliation => {
  const p = path.join(DATA, "reconciliation.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
});

export const getEmails = cache((): Email[] => {
  const p = path.join(DATA, "emails.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
});

export const getEmailById = cache((id: string): Email | null => {
  const list = getEmails();
  return list.find(e => e.id === id) ?? null;
});

export const getSpending = cache((): any => {
  const p = path.join(DATA, "spending.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
});
