# Academy Course-Routing UI/UX Workflow

**Purpose:** Move the right visitor from `academy.html` into the exact course in `academy.alexandriasdesign.com` (Moodle 4.5) with as few clicks as possible — and with the correct buying path attached.

---

## 1. The fork: who is buying?

Every Academy product has two buyers with different paths:

| Buyer | What they want | Where they end | Enrollment method |
|---|---|---|---|
| **Individual consumer** (educator, professional, student) | Buy one seat, take the course now | Stripe checkout → self-enrollment in Moodle | Moodle "Self-enrolment" plugin, enrolment key |
| **Business / district / org** | Buy a seat pack, assign learners, get reporting | Discovery call → invoice → bulk cohort enrollment | Moodle "Manual enrolment" by admin |

**On `academy.html`** — every product card needs a two-button footer:

```
┌─────────────────────────────────────────────────┐
│  Course Title                                   │
│  Description                                    │
│                                                 │
│  [ Buy as Individual → ]   [ Buy for a Team → ] │
└─────────────────────────────────────────────────┘
```

---

## 2. Individual-buyer path (consumer)

**`academy.html` "Buy as Individual" button →**

1. Stripe Checkout (one-time payment, includes the Moodle enrolment key in the metadata)
2. On payment success → Stripe webhook fires → backend (Hostinger n8n or simple PHP webhook) emails the buyer:
   - Receipt
   - A magic enrollment URL with their account pre-staged: `https://academy.alexandriasdesign.com/login/signup.php?wantsurl=%2Fenrol%2Findex.php%3Fid%3DCOURSE_ID&enrolkey=THE_KEY`
3. Buyer clicks magic URL → creates Moodle account → auto-redirected to course self-enrollment → course unlocked.

**Required Moodle URL patterns** (Moodle 4.5):

| Action | URL |
|---|---|
| Login + redirect to course | `/login/index.php?wantsurl=%2Fcourse%2Fview.php%3Fid%3DN` |
| Self-enrollment with key | `/enrol/index.php?id=N` (user prompted for the enrolment key) |
| Direct course view (post-enrollment) | `/course/view.php?id=N` |
| Direct SCORM activity launch | `/mod/scorm/view.php?id=ACTIVITY_ID` |
| Sign-up (new account) | `/login/signup.php?wantsurl=...` |

**One-time enrolment keys** (admin → course → enrolment methods → Self-enrolment):
- One key per cohort. Rotate every ~90 days.
- Embed the key in Stripe success-page metadata; never expose it on `academy.html` itself.

---

## 3. Business-buyer path (B2B)

**`academy.html` "Buy for a Team" button →**

1. Pre-filled `mailto:cmartin@alexandriasdesign.com` (or a Cal.com booking link) → 30-min discovery call.
2. On call: confirm seat count, agree on price, send invoice (Stripe Invoicing).
3. On payment: Marie/Charles bulk-creates accounts in Moodle (admin → site admin → users → upload users) and enrolls them in the course cohort.
4. Each learner gets a welcome email with:
   - Login URL: `https://academy.alexandriasdesign.com/login`
   - Temp password + reset instructions
   - Direct link to their first activity: `/mod/scorm/view.php?id=ACTIVITY_ID`

**Reporting:** Moodle's built-in course completion reports + a quarterly PDF emailed to the org admin. (For larger contracts, set up a learning record store via xAPI.)

---

## 4. Course catalog mapping

Each Academy product needs a Moodle course ID + activity ID written down. Until those IDs are stable, the buttons on `academy.html` can hold placeholders:

| Academy product | Moodle course | Status |
|---|---|---|
| CAAASA AI Academy — Module 1 (Marie) | TBD — package uploaded at `~/trpec-site/caaasa-ai-academy/scorm-package/` | Live SCORM |
| Discovery Collective AI Onboarding | `DC-AI-ONB-101` (6-SCO SCORM) | Live |
| ECM Care Manager Year-Long Sim | `ECM-SIM-CM-101` (mdl_scorm.id=30, activity 33) | Live SCORM, demo public at ecm-simulation.srv1158960.hstgr.cloud |
| AI Workforce Fluency | TBD (Marie's 9-module corporate course) | Authored, needs SCORM packaging |
| PMP Module 1 | TBD | Planned |
| Flipped Classroom / ILS / VLS / Train-the-Trainer kits | Not Moodle-hosted — these are licensed kit downloads | Use Gumroad or Stripe digital-product flow |

> **Action item:** Once each course is published in Moodle, capture its `id=N` from the URL and update this table. The IDs are stable as long as you don't delete the course.

---

## 5. Recommended URL patterns to wire today

In `academy.html`, every "Buy as Individual" button should hit a single thin router page (e.g. `/buy.html?course=ecm-cm`) that:
1. Looks up the Stripe price ID for that course
2. Looks up the Moodle course ID
3. Creates a checkout session
4. On success, returns the magic enrollment URL

This keeps the academy page free of Stripe + Moodle internals. The router lives at `~/alexandrias-design-redesign/mockup/buy.html` (to build) or as a serverless function on the VPS.

For now, the buttons can ship as `mailto:` links with the course name in the subject, and we migrate to the Stripe router in Phase B.

---

## 6. Open decisions for Marie

1. **Stripe vs. Gumroad for digital-only products** (the kit downloads). Stripe has better reporting; Gumroad is faster to set up.
2. **Course enrolment keys: rotate quarterly, or per-cohort?** Quarterly is simpler; per-cohort gives finer reporting.
3. **B2B discovery call → who runs it?** Default is Charles (cmartin@) since the contact CTAs all route to him.
4. **Refund policy** for individual buyers — Moodle / Stripe both support it but we need a written rule (e.g. 7-day no-questions, or only before first SCORM completion).
