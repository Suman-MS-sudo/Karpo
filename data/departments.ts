// Canonical list of corporate departments — shared between the referral
// posting form (dropdown) and the referral search filters (multi-select),
// so a posting's department always matches something searchable.
//
// Consolidated to 10 broad categories (previously 34 granular ones) so the
// filter strip stays usable at a glance. Existing postings under the old,
// more granular names are remapped to these via
// scripts/migrate-referral-department-consolidation.mjs.
export const DEPARTMENTS: string[] = [
  "Engineering & IT",
  "Product & Design",
  "Data & AI/ML",
  "Sales & Business Development",
  "Marketing & Communications",
  "Customer Success & Support",
  "Finance & Legal",
  "Human Resources",
  "Operations & Strategy",
  "Other",
]
