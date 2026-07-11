import { RawCsvRow, CrmRecordDraft, CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from "../../types";

// Deterministic fallback used when AI_PROVIDER=mock. No LLM call, no key needed.
// Maps common header name variants onto the CRM schema with plain string matching.
// Covers the layouts in samples/ well; swap AI_PROVIDER back to a real provider
// for genuine semantic mapping on exports this heuristic doesn't recognize.

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const NAME_KEYS = ["name", "fullname", "contactname", "leadname", "customername"];
const EMAIL_KEYS = ["email", "emailaddress", "mail", "contactemail", "leademail"];
const PHONE_KEYS = ["phone", "phonenumber", "mobile", "mobilenumber", "contactnumber", "whatsapp", "cell", "telephone"];
const CITY_KEYS = ["city"];
const STATE_KEYS = ["state", "province"];
const COUNTRY_KEYS = ["country"];
const COMPANY_KEYS = ["company", "companyname", "organisation", "organization", "business", "businessname"];
const OWNER_KEYS = ["leadowner", "owner", "agent", "assignedto", "salesperson", "salesrep"];
const STATUS_KEYS = ["status", "leadstatus", "stage", "crmstatus"];
const NOTE_KEYS = ["notes", "note", "remark", "remarks", "comment", "comments"];
const DESCRIPTION_KEYS = ["description", "details", "message"];
const POSSESSION_KEYS = ["possession", "possessiontime", "possessiondate"];
const DATE_KEYS = ["createdat", "createdtime", "submissiondate", "date", "timestamp", "createddate", "leaddate"];

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map((h) => [h, normalizeHeader(h)] as const);
  for (const candidate of candidates) {
    const hit = normalized.find(([, n]) => n === candidate);
    if (hit) return hit[0];
  }
  return undefined;
}

function splitMulti(value: string): string[] {
  return value.split(/[;,/]/).map((s) => s.trim()).filter(Boolean);
}

// India-biased heuristic: a real LLM infers country from context, this can't,
// so it assumes +91 for bare 10-digit numbers since the sample data (and GrowEasy
// itself) is India-focused. Numbers with an explicit "+" are parsed as given.
function splitPhone(raw: string): { code: string; mobile: string } {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return { code: "", mobile: "" };
  if (digits.startsWith("+")) {
    const m = digits.match(/^\+(\d{1,3})(\d{10})$/);
    if (m) return { code: `+${m[1]}`, mobile: m[2] };
    return { code: "", mobile: digits.slice(1) };
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return { code: "+91", mobile: digits.slice(2) };
  }
  if (digits.length === 10) {
    return { code: "+91", mobile: digits };
  }
  return { code: "", mobile: digits };
}

const STATUS_RULES: Array<{ keywords: string[]; value: (typeof CRM_STATUS_VALUES)[number] }> = [
  { keywords: ["not interested", "junk", "spam", "invalid", "bad lead"], value: "BAD_LEAD" },
  { keywords: ["not connect", "no answer", "unreachable", "no response"], value: "DID_NOT_CONNECT" },
  { keywords: ["sale", "closed", "won", "converted"], value: "SALE_DONE" },
  { keywords: ["follow", "new", "hot", "warm", "interested", "good lead"], value: "GOOD_LEAD_FOLLOW_UP" },
];

function mapStatus(raw: string): string {
  const v = raw.toLowerCase();
  for (const rule of STATUS_RULES) {
    if (rule.keywords.some((k) => v.includes(k))) return rule.value;
  }
  return "";
}

const SOURCE_RULES: Array<{ keyword: string; value: (typeof DATA_SOURCE_VALUES)[number] }> = [
  { keyword: "leads on demand", value: "leads_on_demand" },
  { keyword: "meridian", value: "meridian_tower" },
  { keyword: "eden", value: "eden_park" },
  { keyword: "varah", value: "varah_swamy" },
  { keyword: "sarjapur", value: "sarjapur_plots" },
];

// scans every value in the row, not just one column, since which column names
// the campaign/project varies a lot more than which column names the email does
function mapDataSource(row: Record<string, string>): string {
  const haystack = Object.values(row).join(" ").toLowerCase();
  for (const rule of SOURCE_RULES) {
    if (haystack.includes(rule.keyword)) return rule.value;
  }
  return "";
}

function mapRow(row: RawCsvRow): CrmRecordDraft {
  const headers = Object.keys(row.data);
  const claimed = new Set<string>();
  const claim = (col: string | undefined) => {
    if (col) claimed.add(col);
    return col;
  };

  const nameCol = claim(findColumn(headers, NAME_KEYS));
  const emailCol = claim(findColumn(headers, EMAIL_KEYS));
  const phoneCol = claim(findColumn(headers, PHONE_KEYS));
  const cityCol = claim(findColumn(headers, CITY_KEYS));
  const stateCol = claim(findColumn(headers, STATE_KEYS));
  const countryCol = claim(findColumn(headers, COUNTRY_KEYS));
  const companyCol = claim(findColumn(headers, COMPANY_KEYS));
  const ownerCol = claim(findColumn(headers, OWNER_KEYS));
  const statusCol = claim(findColumn(headers, STATUS_KEYS));
  const noteCol = claim(findColumn(headers, NOTE_KEYS));
  const descCol = claim(findColumn(headers, DESCRIPTION_KEYS));
  const possessionCol = claim(findColumn(headers, POSSESSION_KEYS));
  const dateCol = claim(findColumn(headers, DATE_KEYS));

  // any leftover column that still looks like an email/phone column is a
  // *second* one (e.g. "Alt Phone") -> goes to crm_note, not overwritten
  const extraEmailCols = headers.filter((h) => !claimed.has(h) && normalizeHeader(h).includes("mail"));
  const extraPhoneCols = headers.filter(
    (h) => !claimed.has(h) && (normalizeHeader(h).includes("phone") || normalizeHeader(h).includes("mobile"))
  );

  const noteParts: string[] = [];
  if (noteCol && row.data[noteCol]) noteParts.push(row.data[noteCol]);

  const rawEmails = emailCol && row.data[emailCol] ? splitMulti(row.data[emailCol]) : [];
  for (const col of extraEmailCols) {
    if (row.data[col]) rawEmails.push(...splitMulti(row.data[col]));
  }
  const primaryEmail = rawEmails[0] || "";
  if (rawEmails.length > 1) noteParts.push(`Additional email: ${rawEmails.slice(1).join(", ")}`);

  const rawPhones = phoneCol && row.data[phoneCol] ? [row.data[phoneCol]] : [];
  for (const col of extraPhoneCols) {
    if (row.data[col]) rawPhones.push(row.data[col]);
  }
  const { code, mobile } = rawPhones[0] ? splitPhone(rawPhones[0]) : { code: "", mobile: "" };
  if (rawPhones.length > 1) noteParts.push(`Additional phone: ${rawPhones.slice(1).join(", ")}`);

  const skip = !primaryEmail && !mobile;

  return {
    row_index: row.row_index,
    created_at: dateCol ? row.data[dateCol] || "" : "",
    name: nameCol ? row.data[nameCol] || "" : "",
    email: primaryEmail,
    country_code: code,
    mobile_without_country_code: mobile,
    company: companyCol ? row.data[companyCol] || "" : "",
    city: cityCol ? row.data[cityCol] || "" : "",
    state: stateCol ? row.data[stateCol] || "" : "",
    country: countryCol ? row.data[countryCol] || "" : "",
    lead_owner: ownerCol ? row.data[ownerCol] || "" : "",
    crm_status: statusCol ? mapStatus(row.data[statusCol] || "") : "",
    crm_note: noteParts.join(" | "),
    data_source: mapDataSource(row.data),
    possession_time: possessionCol ? row.data[possessionCol] || "" : "",
    description: descCol ? row.data[descCol] || "" : "",
    skip,
    skip_reason: skip ? "No email or mobile number present" : undefined,
  };
}

export function mockExtractBatch(rows: RawCsvRow[]): CrmRecordDraft[] {
  return rows.map(mapRow);
}
