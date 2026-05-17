# Hi-Tech school management — programme marklist

Use this checklist to verify each strand of work. Items marked **[done]** are implemented in this pass; others remain operational follow-ups where noted.

## 1. School branding / logo cascade

| # | Deliverable | Status |
|---|-------------|--------|
| 1.1 | Full school-admin portal sidebar uses the configured school logo (with sensible fallback when none is set). | **[done]** |
| 1.2 | Finance / bursar module sidebar shows the same school logo (standalone finance mode included). | **[done]** |
| 1.3 | Confirm parent / student sidebars still meet product intent (currently platform logo; escalate if tenant branding is required there too). | Open |

## 2. Seed data / grade ladder (ECD + primary)

| # | Deliverable | Status |
|---|-------------|--------|
| 2.1 | Replace platform + per-school seeded grades with: **Playgroup & Day Care**, **PP1**, **PP2**, **Grade 1** … **Grade 9**. | **[done]** (run `prisma db seed`) |
| 2.2 | After changing seeds, reconcile **existing deployments**: backup DB, rerun seed-aware migration strategy, recreate classes/fee structures as needed. | Ops |

## 3. Parent contacts: phone-first, optional email

| # | Deliverable | Status |
|---|-------------|--------|
| 3.1 | Parent/guardian **email optional** on student create/update API and in bursar + school-portal flows. | **[done]** |
| 3.2 | Synthetic parent login emails when omitted (already supported in API paths). | Existing + **[done]** |
| 3.3 | Prefer **validated Kenyan MSISDN** UX (copy guidance only; regex exists on `SMSService`). | Follow-up polish |

## 4. Birth date vs enrolment

| # | Deliverable | Status |
|---|-------------|--------|
| 4.1 | **Date of enrolment / admission date** surfaced as the primary onboarding field where DOB was over-emphasised. | **[done]** (UI + retained `dateAdmitted`) |
| 4.2 | Remove DOB‑first UX (`yearOfBirth` / dob fields) from guided flows aligned with stakeholder feedback; optional DOB backend field remains for downstream use. | **[done]** in targeted forms |

## 5. Day scholars vs boarders (fees)

| # | Deliverable | Status |
|---|-------------|--------|
| 5.1 | `Student.feeAccommodation` (`day_scholar` \| `boarder`). | **[done]** (migration required) |
| 5.2 | `TermlyFeeStructure.feeAccommodation` optional: **null** = applies to everyone (backward compatible); **day_scholar** / **boarder** = segmented. | **[done]** |
| 5.3 | Resolve fee rows per student:** prefer matching segment**, else fall back to unified (null). | **[done]** (snapshot + balance paths) |
| 5.4 | Fee management UI:** “Applies to”** selector on create/edit. | **[done]** |
| 5.5 | Full audit of scripts/tests under repo root (`test-*.js`, `debug-*.js`) for old assumptions. | Backlog |

## 6. Africa’s Talking SMS (fee notices)

| # | Deliverable | Status |
|---|-------------|--------|
| 6.1 | SMS provider recognises `SMS_PROVIDER=africas_talking` with `AFRIICASTALKING_API_KEY` + `AFRIICASTALKING_USERNAME`. | **[done]** |
| 6.2 | Normalize destination numbers before dispatch (`+254…`). | **[done]** (in SMS core sender) |
| 6.3 | Wire SMS on **automated payment** path (`PaymentService`), not only manual bursar entry. | **[done]** |
| 6.4 | Persist delivery logs (`SMSLog` table) / retry UX. | Not in scope |

## 7. Operations

| # | Deliverable | Status |
|---|-------------|--------|
| 7.1 | Run `npx prisma migrate deploy` (or Dev `migrate dev`) against each environment after pulling. | Ops |
| 7.2 | Re-seed grades only after understanding **data destructive** steps (`seed.ts` wipes termly structures under grades cleanup). | Ops |
