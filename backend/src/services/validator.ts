import {
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  CrmRecord,
  CrmRecordDraft,
} from "../types";

const STATUS_SET = new Set<string>(CRM_STATUS_VALUES);
const SOURCE_SET = new Set<string>(DATA_SOURCE_VALUES);

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export interface ValidationOutcome {
  ok: boolean;
  reason?: string;
  record?: CrmRecord;
}

// re-check the AI's output against the actual rules, don't just trust it (enum drift, bad dates etc.)
export function validateDraft(draft: CrmRecordDraft): ValidationOutcome {
  const email = str(draft.email);
  const mobile = str(draft.mobile_without_country_code);

  if (draft.skip || (!email && !mobile)) {
    return { ok: false, reason: draft.skip_reason || "No email or mobile number present" };
  }

  const createdAt = str(draft.created_at);
  if (createdAt && Number.isNaN(new Date(createdAt).getTime())) {
    draft.created_at = "";
  }

  let crmStatus = str(draft.crm_status);
  if (crmStatus && !STATUS_SET.has(crmStatus)) crmStatus = "";

  let dataSource = str(draft.data_source);
  if (dataSource && !SOURCE_SET.has(dataSource)) dataSource = "";

  const record: CrmRecord = {
    row_index: draft.row_index,
    created_at: str(draft.created_at),
    name: str(draft.name),
    email,
    country_code: str(draft.country_code),
    mobile_without_country_code: mobile,
    company: str(draft.company),
    city: str(draft.city),
    state: str(draft.state),
    country: str(draft.country),
    lead_owner: str(draft.lead_owner),
    crm_status: crmStatus,
    crm_note: str(draft.crm_note),
    data_source: dataSource,
    possession_time: str(draft.possession_time),
    description: str(draft.description),
  };

  return { ok: true, record };
}
