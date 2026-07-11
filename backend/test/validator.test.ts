import { describe, it, expect } from "vitest";
import { validateDraft } from "../src/services/validator";
import { CrmRecordDraft } from "../src/types";

function draft(overrides: Partial<CrmRecordDraft> = {}): CrmRecordDraft {
  return {
    row_index: 0,
    created_at: "2026-06-01 10:00:00",
    name: "Jane Doe",
    email: "jane@example.com",
    country_code: "+91",
    mobile_without_country_code: "9876543210",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    crm_note: "",
    data_source: "leads_on_demand",
    possession_time: "",
    description: "",
    skip: false,
    ...overrides,
  };
}

describe("validateDraft", () => {
  it("accepts a well-formed record", () => {
    const v = validateDraft(draft());
    expect(v.ok).toBe(true);
    expect(v.record?.email).toBe("jane@example.com");
  });

  it("skips a record with neither email nor mobile", () => {
    const v = validateDraft(draft({ email: "", mobile_without_country_code: "" }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/email or mobile/i);
  });

  it("keeps a record with only a mobile number", () => {
    const v = validateDraft(draft({ email: "" }));
    expect(v.ok).toBe(true);
  });

  it("keeps a record with only an email", () => {
    const v = validateDraft(draft({ mobile_without_country_code: "" }));
    expect(v.ok).toBe(true);
  });

  it("respects the model's own skip flag", () => {
    const v = validateDraft(draft({ skip: true, skip_reason: "duplicate row" }));
    expect(v.ok).toBe(false);
    expect(v.reason).toBe("duplicate row");
  });

  it("blanks out a crm_status outside the allowed enum instead of passing it through", () => {
    const v = validateDraft(draft({ crm_status: "SUPER_HOT_LEAD" }));
    expect(v.ok).toBe(true);
    expect(v.record?.crm_status).toBe("");
  });

  it("blanks out a data_source outside the allowed enum instead of passing it through", () => {
    const v = validateDraft(draft({ data_source: "some_random_campaign" }));
    expect(v.ok).toBe(true);
    expect(v.record?.data_source).toBe("");
  });

  it("drops an unparsable created_at rather than rejecting the whole record", () => {
    const v = validateDraft(draft({ created_at: "not a date" }));
    expect(v.ok).toBe(true);
    expect(v.record?.created_at).toBe("");
  });

  it("keeps a valid created_at that new Date() can parse", () => {
    const v = validateDraft(draft({ created_at: "2026-06-01 10:00:00" }));
    expect(v.ok).toBe(true);
    expect(Number.isNaN(new Date(v.record!.created_at).getTime())).toBe(false);
  });
});
