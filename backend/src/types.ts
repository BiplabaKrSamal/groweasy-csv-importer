export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];
export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

// Shape the AI is asked to return for every input row.
export interface CrmRecordDraft {
  row_index: number;
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
  skip: boolean;
  skip_reason?: string;
}

// Final validated record returned to the client.
export type CrmRecord = Omit<CrmRecordDraft, "skip" | "skip_reason">;

export interface ExtractionResult {
  imported: CrmRecord[];
  skipped: Array<{ row_index: number; raw: Record<string, string>; reason: string }>;
  total_input: number;
  total_imported: number;
  total_skipped: number;
}

export interface RawCsvRow {
  row_index: number;
  data: Record<string, string>;
}
