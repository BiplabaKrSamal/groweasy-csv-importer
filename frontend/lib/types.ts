export interface CrmRecord {
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
}

export interface SkippedRecord {
  row_index: number;
  raw: Record<string, string>;
  reason: string;
}

export interface ExtractionResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  total_input: number;
  total_imported: number;
  total_skipped: number;
  engine: string;
}

export type Step = "upload" | "preview" | "processing" | "result";
