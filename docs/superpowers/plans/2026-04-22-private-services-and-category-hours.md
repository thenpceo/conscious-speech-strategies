# Private Services Update & Category-Based Hour Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the public-facing private services page with summer therapy info, pricing, and a multi-step questionnaire; add a CTA button on the home page; and revamp hour logging for SLAM Tampa Elem/Middle-High to support category-based hour breakdowns.

**Architecture:** Four independent workstreams: (1) Home page CTA button, (2) Private services page content + multi-step questionnaire form, (3) Database migration for questionnaire submissions table, (4) Category-based hour logging for two specific SLAM Tampa schools. The questionnaire replaces the current simple intake form with an 8-section multi-page wizard. The hours form switches from single time_in/time_out to multiple category+hours rows when SLAM Tampa Elem or Middle/High is selected.

**Tech Stack:** Next.js 13+ App Router, React (client components), Supabase PostgreSQL, Tailwind CSS with custom theme (warm-white, sage, peach, charcoal, cream, olive)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/Services.tsx` | Add "Want one-on-one service?" CTA button |
| Modify | `src/app/services/page.tsx` | Complete rewrite: pricing, service info, multi-step questionnaire |
| Create | `supabase/migration-questionnaire.sql` | New `questionnaire_submissions` table |
| Modify | `src/app/admin/hours/new/page.tsx` | Category-based hour logging for SLAM Tampa schools |
| Modify | `src/app/admin/hours/[id]/edit/page.tsx` | Same category-based editing for SLAM Tampa schools |
| Modify | `src/app/admin/hours/page.tsx` | Display category breakdowns in hours list |
| Modify | `src/lib/supabase/types.ts` | Add QuestionnaireSubmission type |

---

### Task 1: Home Page — Add "Want One-on-One Service?" CTA Button

**Files:**
- Modify: `src/components/Services.tsx:55-143`

- [ ] **Step 1: Add CTA button to Services component**

At the bottom of the Services section (after the two-column grid, before closing `</div></section>`), add a centered CTA block. Insert after line 138 (`</div>`) and before the closing `</div></section>`:

```tsx
{/* Private Services CTA */}
<div className="fade-up mt-16 text-center">
  <a
    href="/services"
    className="inline-flex items-center gap-2 rounded-xl bg-sage px-8 py-4 font-body text-sm font-semibold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20"
  >
    Want One-on-One Service?
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  </a>
</div>
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev` and check the home page Services section — the button should appear centered below the two-column layout.

- [ ] **Step 3: Commit**

```bash
git add src/components/Services.tsx
git commit -m "feat: add one-on-one service CTA to home page services section"
```

---

### Task 2: Database Migration — Questionnaire Submissions Table

**Files:**
- Create: `supabase/migration-questionnaire.sql`
- Modify: `src/lib/supabase/types.ts`

- [ ] **Step 1: Create migration file**

The questionnaire has many fields across 8 sections. Store the structured data as JSONB since the form sections have nested checkbox/text combos that don't map well to flat columns. Keep top-level identity fields as proper columns for easy querying.

```sql
-- Migration: Create questionnaire_submissions table for private services intake
-- Run in Supabase SQL Editor after previous migrations.

CREATE TABLE public.questionnaire_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Identity & contact
  child_name text NOT NULL,
  date_of_birth text,
  parent_name text NOT NULL,
  relationship text,
  email text,
  phone text,
  address text,
  -- Service preferences
  service_type text CHECK (service_type IN ('evaluation', 'therapy', 'both')),
  eval_type text, -- speech, language, fluency (or comma-separated)
  therapy_type text CHECK (therapy_type IN ('individualized', 'group')),
  session_preference text CHECK (session_preference IN ('in_person', 'virtual')),
  has_iep boolean DEFAULT false,
  wants_evaluation boolean DEFAULT false,
  -- Questionnaire sections (JSONB for flexibility)
  pregnancy_birth jsonb DEFAULT '{}'::jsonb,
  medical_health jsonb DEFAULT '{}'::jsonb,
  developmental_milestones jsonb DEFAULT '{}'::jsonb,
  speech_language jsonb DEFAULT '{}'::jsonb,
  social_behavioral jsonb DEFAULT '{}'::jsonb,
  education jsonb DEFAULT '{}'::jsonb,
  family_history jsonb DEFAULT '{}'::jsonb,
  parent_input jsonb DEFAULT '{}'::jsonb,
  -- Metadata
  date_completed date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.questionnaire_submissions ENABLE ROW LEVEL SECURITY;

-- Public insert (no auth required — this is a public form)
CREATE POLICY "Anyone can submit questionnaire" ON public.questionnaire_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Authenticated read questionnaire" ON public.questionnaire_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated update questionnaire" ON public.questionnaire_submissions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete questionnaire" ON public.questionnaire_submissions
  FOR DELETE TO authenticated USING (true);
```

- [ ] **Step 2: Add TypeScript type**

Add to the end of `src/lib/supabase/types.ts` (before the closing of the file):

```typescript
export interface QuestionnaireSubmission {
  id: string;
  child_name: string;
  date_of_birth: string | null;
  parent_name: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  service_type: "evaluation" | "therapy" | "both" | null;
  eval_type: string | null;
  therapy_type: "individualized" | "group" | null;
  session_preference: "in_person" | "virtual" | null;
  has_iep: boolean;
  wants_evaluation: boolean;
  pregnancy_birth: Record<string, unknown>;
  medical_health: Record<string, unknown>;
  developmental_milestones: Record<string, unknown>;
  speech_language: Record<string, unknown>;
  social_behavioral: Record<string, unknown>;
  education: Record<string, unknown>;
  family_history: Record<string, unknown>;
  parent_input: Record<string, unknown>;
  date_completed: string;
  created_at: string;
}
```

- [ ] **Step 3: Run migration in Supabase SQL Editor**

Copy and run the SQL from `supabase/migration-questionnaire.sql` in the Supabase dashboard SQL Editor.

- [ ] **Step 4: Commit**

```bash
git add supabase/migration-questionnaire.sql src/lib/supabase/types.ts
git commit -m "feat: add questionnaire_submissions table for private services intake"
```

---

### Task 3: Private Services Page — Complete Rewrite

**Files:**
- Modify: `src/app/services/page.tsx` (full rewrite)

This is the largest task. The page needs:
1. Updated hero & service info (summer therapy, pricing, locations, eval vs therapy)
2. Multi-step questionnaire form (8 pages matching the Speech & Language Background Questionnaire)

- [ ] **Step 1: Rewrite the services page**

Replace the entire content of `src/app/services/page.tsx` with the new implementation. The form is a multi-step wizard with these steps:

**Step 0 — Service Selection:** What they want (eval, therapy, or both), therapy type (individual/group), session preference (in-person/virtual), IEP status
**Step 1 — Child Info & Contact:** Child's name, DOB, parent name, relationship, email, phone, address
**Step 2 — Pregnancy & Birth History:** Checkboxes + text fields per the questionnaire
**Step 3 — Medical & Health History:** Diagnosed conditions, ear infections, hearing, vision, medications, surgeries
**Step 4 — Developmental Milestones:** Crawled/walked/potty trained/first words ages, motor/feeding concerns
**Step 5 — Speech & Language:** Languages at home, understanding, expression, clarity, previous therapy
**Step 6 — Social & Behavioral:** Peer interaction, eye contact, attention, behavior concerns
**Step 7 — Education & Family History:** School/grade, academic concerns, family history of speech/learning/hearing
**Step 8 — Parent Input & Review:** Main concerns, improvement goals, additional info, then submit

The page should show pricing info and service details ABOVE the form. The form should have a progress indicator and prev/next navigation.

Key implementation details:
- Use `useState` with a `step` counter (0-8) and a large form state object
- Each step renders its own fieldset
- The form submits to `questionnaire_submissions` table via Supabase client
- Service selection fields go into proper columns; questionnaire sections go into JSONB columns
- Maintain the existing nav bar and footer styling
- Use the same Tailwind theme (warm-white, sage, peach, charcoal, cream)
- The form uses the same `inputClass` pattern already in the file
- Add checkbox styling consistent with the design

The pricing section should display:
- **Evaluations:** Speech $275, Language $350, Fluency $350
- **Therapy:** Individualized 30-min session $65, Group (2+ students) $35
- **Details:** All sessions 30 minutes, up to 2x/week, in-person at SLAM Apollo or private residence in St. Petersburg, virtual available for qualifying candidates
- **Note:** Students need evaluation unless they have an IEP (can still request eval)

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useReveal } from "@/hooks/useReveal";

const TOTAL_STEPS = 9; // 0-8

export default function ServicesPage() {
  const ref = useReveal();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Service preferences (step 0)
  const [serviceType, setServiceType] = useState<string>("");
  const [evalTypes, setEvalTypes] = useState<string[]>([]);
  const [therapyType, setTherapyType] = useState<string>("");
  const [sessionPref, setSessionPref] = useState<string>("");
  const [hasIep, setHasIep] = useState<boolean | null>(null);
  const [wantsEval, setWantsEval] = useState<boolean | null>(null);

  // Child & contact info (step 1)
  const [childName, setChildName] = useState("");
  const [dob, setDob] = useState("");
  const [parentName, setParentName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Pregnancy & birth (step 2)
  const [pregnancyConcerns, setPregnancyConcerns] = useState("");
  const [pregnancyConcernsDesc, setPregnancyConcernsDesc] = useState("");
  const [bornTerm, setBornTerm] = useState("");
  const [earlyWeeks, setEarlyWeeks] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryOther, setDeliveryOther] = useState("");
  const [deliveryComplications, setDeliveryComplications] = useState("");
  const [deliveryComplicationsDesc, setDeliveryComplicationsDesc] = useState("");
  const [nicuTime, setNicuTime] = useState("");
  const [nicuDuration, setNicuDuration] = useState("");

  // Medical & health (step 3)
  const [medicalConditions, setMedicalConditions] = useState("");
  const [medicalConditionsDesc, setMedicalConditionsDesc] = useState("");
  const [earInfections, setEarInfections] = useState("");
  const [earTubes, setEarTubes] = useState("");
  const [hearingConcerns, setHearingConcerns] = useState("");
  const [lastHearingTest, setLastHearingTest] = useState("");
  const [visionConcerns, setVisionConcerns] = useState("");
  const [medications, setMedications] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [surgeriesDesc, setSurgeriesDesc] = useState("");

  // Developmental milestones (step 4)
  const [crawled, setCrawled] = useState("");
  const [walked, setWalked] = useState("");
  const [pottyTrained, setPottyTrained] = useState("");
  const [firstWords, setFirstWords] = useState("");
  const [combiningWords, setCombiningWords] = useState("");
  const [overallDev, setOverallDev] = useState("");
  const [motorConcerns, setMotorConcerns] = useState("");
  const [feedingConcerns, setFeedingConcerns] = useState("");
  const [devConcernsExplain, setDevConcernsExplain] = useState("");

  // Speech & language (step 5)
  const [languagesAtHome, setLanguagesAtHome] = useState("");
  const [understandsOthers, setUnderstandsOthers] = useState("");
  const [expressesClearly, setExpressesClearly] = useState("");
  const [understoodByStrangers, setUnderstoodByStrangers] = useState("");
  const [speechConcerns, setSpeechConcerns] = useState("");
  const [speechConcernsDesc, setSpeechConcernsDesc] = useState("");
  const [previousTherapy, setPreviousTherapy] = useState("");
  const [previousTherapyDesc, setPreviousTherapyDesc] = useState("");

  // Social & behavioral (step 6)
  const [peerInteraction, setPeerInteraction] = useState("");
  const [eyeContact, setEyeContact] = useState("");
  const [attentionConcerns, setAttentionConcerns] = useState("");
  const [behaviorConcerns, setBehaviorConcerns] = useState("");
  const [behaviorDesc, setBehaviorDesc] = useState("");

  // Education & family (step 7)
  const [schoolGrade, setSchoolGrade] = useState("");
  const [academicConcerns, setAcademicConcerns] = useState("");
  const [academicConcernsDesc, setAcademicConcernsDesc] = useState("");
  const [strengths, setStrengths] = useState("");
  const [areasOfConcern, setAreasOfConcern] = useState("");
  const [familySpeech, setFamilySpeech] = useState("");
  const [familyLearning, setFamilyLearning] = useState("");
  const [familyHearing, setFamilyHearing] = useState("");
  const [familyExplain, setFamilyExplain] = useState("");

  // Parent input (step 8)
  const [mainConcerns, setMainConcerns] = useState("");
  const [improvementGoals, setImprovementGoals] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  function toggleEvalType(t: string) {
    setEvalTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function handleSubmit() {
    if (!childName || !parentName || (!email && !phone)) {
      alert("Please provide the child's name, your name, and at least an email or phone number.");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("questionnaire_submissions").insert({
      child_name: childName,
      date_of_birth: dob || null,
      parent_name: parentName,
      relationship: relationship || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      service_type: serviceType || null,
      eval_type: evalTypes.length > 0 ? evalTypes.join(", ") : null,
      therapy_type: therapyType || null,
      session_preference: sessionPref || null,
      has_iep: hasIep ?? false,
      wants_evaluation: wantsEval ?? false,
      pregnancy_birth: {
        concerns: pregnancyConcerns,
        concerns_desc: pregnancyConcernsDesc,
        born_term: bornTerm,
        early_weeks: earlyWeeks,
        delivery_type: deliveryType,
        delivery_other: deliveryOther,
        complications: deliveryComplications,
        complications_desc: deliveryComplicationsDesc,
        nicu: nicuTime,
        nicu_duration: nicuDuration,
      },
      medical_health: {
        conditions: medicalConditions,
        conditions_desc: medicalConditionsDesc,
        ear_infections: earInfections,
        ear_tubes: earTubes,
        hearing_concerns: hearingConcerns,
        last_hearing_test: lastHearingTest,
        vision_concerns: visionConcerns,
        medications,
        surgeries,
        surgeries_desc: surgeriesDesc,
      },
      developmental_milestones: {
        crawled, walked, potty_trained: pottyTrained,
        first_words: firstWords, combining_words: combiningWords,
        overall_dev: overallDev, motor_concerns: motorConcerns,
        feeding_concerns: feedingConcerns, explain: devConcernsExplain,
      },
      speech_language: {
        languages_at_home: languagesAtHome,
        understands_others: understandsOthers,
        expresses_clearly: expressesClearly,
        understood_by_strangers: understoodByStrangers,
        concerns: speechConcerns,
        concerns_desc: speechConcernsDesc,
        previous_therapy: previousTherapy,
        previous_therapy_desc: previousTherapyDesc,
      },
      social_behavioral: {
        peer_interaction: peerInteraction,
        eye_contact: eyeContact,
        attention_concerns: attentionConcerns,
        behavior_concerns: behaviorConcerns,
        behavior_desc: behaviorDesc,
      },
      education: {
        school_grade: schoolGrade,
        academic_concerns: academicConcerns,
        academic_concerns_desc: academicConcernsDesc,
        strengths, areas_of_concern: areasOfConcern,
      },
      family_history: {
        speech: familySpeech,
        learning: familyLearning,
        hearing: familyHearing,
        explain: familyExplain,
      },
      parent_input: {
        main_concerns: mainConcerns,
        improvement_goals: improvementGoals,
        anything_else: anythingElse,
      },
    });

    if (error) {
      alert("Error submitting form. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  const inputClass =
    "w-full px-4 py-3 bg-warm-white border border-sage/20 rounded-xl focus:ring-2 focus:ring-sage/20 focus:border-sage outline-none transition-all text-sm text-charcoal placeholder:text-charcoal-light/50";
  const labelClass = "block font-body text-[12px] font-semibold uppercase tracking-wider text-sage-dark mb-1.5";
  const radioGroupClass = "flex flex-wrap gap-2";
  const radioClass = (selected: boolean) =>
    `px-4 py-2 rounded-lg border text-sm font-body cursor-pointer transition-all ${
      selected
        ? "bg-sage text-white border-sage"
        : "bg-warm-white border-sage/20 text-charcoal hover:border-sage/40"
    }`;
  const yesNoClass = (value: string, target: string) =>
    `px-4 py-2 rounded-lg border text-sm font-body cursor-pointer transition-all ${
      value === target
        ? "bg-sage text-white border-sage"
        : "bg-warm-white border-sage/20 text-charcoal hover:border-sage/40"
    }`;

  const stepTitles = [
    "Service Selection",
    "Child & Contact Info",
    "Pregnancy & Birth History",
    "Medical & Health History",
    "Developmental Milestones",
    "Speech & Language",
    "Social & Behavioral",
    "Education & Family History",
    "Your Input & Review",
  ];

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>What services are you interested in? *</label>
              <div className={radioGroupClass}>
                {[
                  { value: "evaluation", label: "Evaluation Only" },
                  { value: "therapy", label: "Therapy Only" },
                  { value: "both", label: "Both Evaluation & Therapy" },
                ].map((o) => (
                  <button key={o.value} type="button" onClick={() => setServiceType(o.value)} className={radioClass(serviceType === o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {(serviceType === "evaluation" || serviceType === "both") && (
              <div>
                <label className={labelClass}>Evaluation Type(s)</label>
                <div className={radioGroupClass}>
                  {["Speech", "Language", "Fluency"].map((t) => (
                    <button key={t} type="button" onClick={() => toggleEvalType(t.toLowerCase())} className={radioClass(evalTypes.includes(t.toLowerCase()))}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(serviceType === "therapy" || serviceType === "both") && (
              <div>
                <label className={labelClass}>Therapy Type</label>
                <div className={radioGroupClass}>
                  <button type="button" onClick={() => setTherapyType("individualized")} className={radioClass(therapyType === "individualized")}>Individualized</button>
                  <button type="button" onClick={() => setTherapyType("group")} className={radioClass(therapyType === "group")}>Group (2+ students)</button>
                </div>
              </div>
            )}
            <div>
              <label className={labelClass}>Do you prefer in-person or virtual?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setSessionPref("in_person")} className={radioClass(sessionPref === "in_person")}>In Person</button>
                <button type="button" onClick={() => setSessionPref("virtual")} className={radioClass(sessionPref === "virtual")}>Virtual</button>
              </div>
              <p className="mt-1.5 font-body text-xs text-charcoal-light">Virtual services available for qualifying candidates. In-person at SLAM Apollo or private residence in St. Petersburg.</p>
            </div>
            <div>
              <label className={labelClass}>Does your child have an IEP?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setHasIep(true)} className={yesNoClass(hasIep === true ? "yes" : hasIep === false ? "no" : "", "yes")}>Yes</button>
                <button type="button" onClick={() => setHasIep(false)} className={yesNoClass(hasIep === false ? "no" : hasIep === true ? "yes" : "", "no")}>No</button>
              </div>
              {hasIep === true && (
                <div className="mt-3">
                  <label className={labelClass}>Would you still like an evaluation?</label>
                  <div className={radioGroupClass}>
                    <button type="button" onClick={() => setWantsEval(true)} className={yesNoClass(wantsEval === true ? "yes" : "", "yes")}>Yes</button>
                    <button type="button" onClick={() => setWantsEval(false)} className={yesNoClass(wantsEval === false ? "no" : "", "no")}>No, follow our IEP</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Child&apos;s Name *</label>
              <input required value={childName} onChange={(e) => setChildName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Your Name (Parent/Guardian) *</label>
              <input required value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Relationship to Child</label>
              <input value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputClass} placeholder="e.g. Mother, Father, Guardian" />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="your@email.com" />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 555-5555" />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputClass} placeholder="Street address, city, state, zip" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Any concerns during pregnancy?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setPregnancyConcerns("no")} className={yesNoClass(pregnancyConcerns, "no")}>No concerns</button>
                <button type="button" onClick={() => setPregnancyConcerns("yes")} className={yesNoClass(pregnancyConcerns, "yes")}>Yes, concerns</button>
              </div>
              {pregnancyConcerns === "yes" && (
                <textarea value={pregnancyConcernsDesc} onChange={(e) => setPregnancyConcernsDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Was your child born:</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setBornTerm("full_term")} className={radioClass(bornTerm === "full_term")}>Full Term</button>
                <button type="button" onClick={() => setBornTerm("early")} className={radioClass(bornTerm === "early")}>Early</button>
              </div>
              {bornTerm === "early" && (
                <input value={earlyWeeks} onChange={(e) => setEarlyWeeks(e.target.value)} className={`${inputClass} mt-2`} placeholder="How many weeks early?" />
              )}
            </div>
            <div>
              <label className={labelClass}>Type of delivery:</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setDeliveryType("vaginal")} className={radioClass(deliveryType === "vaginal")}>Vaginal</button>
                <button type="button" onClick={() => setDeliveryType("c_section")} className={radioClass(deliveryType === "c_section")}>C-Section</button>
                <button type="button" onClick={() => setDeliveryType("other")} className={radioClass(deliveryType === "other")}>Other</button>
              </div>
              {deliveryType === "other" && (
                <input value={deliveryOther} onChange={(e) => setDeliveryOther(e.target.value)} className={`${inputClass} mt-2`} placeholder="Please specify..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Complications during delivery?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setDeliveryComplications("no")} className={yesNoClass(deliveryComplications, "no")}>No complications</button>
                <button type="button" onClick={() => setDeliveryComplications("yes")} className={yesNoClass(deliveryComplications, "yes")}>Yes</button>
              </div>
              {deliveryComplications === "yes" && (
                <textarea value={deliveryComplicationsDesc} onChange={(e) => setDeliveryComplicationsDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Did your child require NICU time?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setNicuTime("no")} className={yesNoClass(nicuTime, "no")}>No</button>
                <button type="button" onClick={() => setNicuTime("yes")} className={yesNoClass(nicuTime, "yes")}>Yes</button>
              </div>
              {nicuTime === "yes" && (
                <input value={nicuDuration} onChange={(e) => setNicuDuration(e.target.value)} className={`${inputClass} mt-2`} placeholder="How long?" />
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Any diagnosed medical conditions?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setMedicalConditions("no")} className={yesNoClass(medicalConditions, "no")}>No</button>
                <button type="button" onClick={() => setMedicalConditions("yes")} className={yesNoClass(medicalConditions, "yes")}>Yes</button>
              </div>
              {medicalConditions === "yes" && (
                <input value={medicalConditionsDesc} onChange={(e) => setMedicalConditionsDesc(e.target.value)} className={`${inputClass} mt-2`} placeholder="Please list conditions..." />
              )}
            </div>
            <div>
              <label className={labelClass}>History of frequent ear infections?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setEarInfections("no")} className={yesNoClass(earInfections, "no")}>No</button>
                <button type="button" onClick={() => setEarInfections("yes")} className={yesNoClass(earInfections, "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Ear tubes placed?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setEarTubes("no")} className={yesNoClass(earTubes, "no")}>No</button>
                <button type="button" onClick={() => setEarTubes("yes")} className={yesNoClass(earTubes, "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Any concerns about hearing?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setHearingConcerns("no")} className={yesNoClass(hearingConcerns, "no")}>No</button>
                <button type="button" onClick={() => setHearingConcerns("yes")} className={yesNoClass(hearingConcerns, "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Date of last hearing test (if known)</label>
              <input value={lastHearingTest} onChange={(e) => setLastHearingTest(e.target.value)} className={inputClass} placeholder="Approximate date" />
            </div>
            <div>
              <label className={labelClass}>Any concerns about vision?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setVisionConcerns("no")} className={yesNoClass(visionConcerns, "no")}>No</button>
                <button type="button" onClick={() => setVisionConcerns("yes")} className={yesNoClass(visionConcerns, "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Current medications (if any)</label>
              <input value={medications} onChange={(e) => setMedications(e.target.value)} className={inputClass} placeholder="List medications or 'None'" />
            </div>
            <div>
              <label className={labelClass}>Any surgeries or hospitalizations?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setSurgeries("no")} className={yesNoClass(surgeries, "no")}>No</button>
                <button type="button" onClick={() => setSurgeries("yes")} className={yesNoClass(surgeries, "yes")}>Yes</button>
              </div>
              {surgeries === "yes" && (
                <textarea value={surgeriesDesc} onChange={(e) => setSurgeriesDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="font-body text-sm text-charcoal-light">Approximate ages are okay.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Crawled</label>
                <input value={crawled} onChange={(e) => setCrawled(e.target.value)} className={inputClass} placeholder="e.g. 8 months" />
              </div>
              <div>
                <label className={labelClass}>Walked</label>
                <input value={walked} onChange={(e) => setWalked(e.target.value)} className={inputClass} placeholder="e.g. 12 months" />
              </div>
              <div>
                <label className={labelClass}>Potty Trained</label>
                <input value={pottyTrained} onChange={(e) => setPottyTrained(e.target.value)} className={inputClass} placeholder="e.g. 3 years" />
              </div>
              <div>
                <label className={labelClass}>First Words</label>
                <input value={firstWords} onChange={(e) => setFirstWords(e.target.value)} className={inputClass} placeholder="e.g. 12 months" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Started combining words</label>
              <input value={combiningWords} onChange={(e) => setCombiningWords(e.target.value)} className={inputClass} placeholder="e.g. 18 months" />
            </div>
            <div>
              <label className={labelClass}>Overall development</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setOverallDev("on_time")} className={radioClass(overallDev === "on_time")}>On Time</button>
                <button type="button" onClick={() => setOverallDev("delayed")} className={radioClass(overallDev === "delayed")}>Delayed</button>
                <button type="button" onClick={() => setOverallDev("unsure")} className={radioClass(overallDev === "unsure")}>Unsure</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Any concerns with motor skills (running, jumping)?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setMotorConcerns("no")} className={yesNoClass(motorConcerns, "no")}>No</button>
                <button type="button" onClick={() => setMotorConcerns("yes")} className={yesNoClass(motorConcerns, "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Any concerns with feeding/swallowing?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setFeedingConcerns("no")} className={yesNoClass(feedingConcerns, "no")}>No</button>
                <button type="button" onClick={() => setFeedingConcerns("yes")} className={yesNoClass(feedingConcerns, "yes")}>Yes</button>
              </div>
            </div>
            {(motorConcerns === "yes" || feedingConcerns === "yes") && (
              <div>
                <label className={labelClass}>Please explain</label>
                <textarea value={devConcernsExplain} onChange={(e) => setDevConcernsExplain(e.target.value)} rows={2} className={inputClass} />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Languages spoken at home</label>
              <input value={languagesAtHome} onChange={(e) => setLanguagesAtHome(e.target.value)} className={inputClass} placeholder="e.g. English, Spanish" />
            </div>
            <div>
              <label className={labelClass}>Does your child understand others?</label>
              <div className={radioGroupClass}>
                {["Always", "Sometimes", "Rarely"].map((o) => (
                  <button key={o} type="button" onClick={() => setUnderstandsOthers(o.toLowerCase())} className={radioClass(understandsOthers === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Does your child express themselves clearly?</label>
              <div className={radioGroupClass}>
                {["Always", "Sometimes", "Rarely"].map((o) => (
                  <button key={o} type="button" onClick={() => setExpressesClearly(o.toLowerCase())} className={radioClass(expressesClearly === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Are they understood by unfamiliar listeners?</label>
              <div className={radioGroupClass}>
                {["Always", "Sometimes", "Rarely"].map((o) => (
                  <button key={o} type="button" onClick={() => setUnderstoodByStrangers(o.toLowerCase())} className={radioClass(understoodByStrangers === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Have you ever had concerns about speech/language?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setSpeechConcerns("no")} className={yesNoClass(speechConcerns, "no")}>No</button>
                <button type="button" onClick={() => setSpeechConcerns("yes")} className={yesNoClass(speechConcerns, "yes")}>Yes</button>
              </div>
              {speechConcerns === "yes" && (
                <textarea value={speechConcernsDesc} onChange={(e) => setSpeechConcernsDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Previous speech therapy?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setPreviousTherapy("no")} className={yesNoClass(previousTherapy, "no")}>No</button>
                <button type="button" onClick={() => setPreviousTherapy("yes")} className={yesNoClass(previousTherapy, "yes")}>Yes</button>
              </div>
              {previousTherapy === "yes" && (
                <input value={previousTherapyDesc} onChange={(e) => setPreviousTherapyDesc(e.target.value)} className={`${inputClass} mt-2`} placeholder="Where and when?" />
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Interaction with peers</label>
              <div className={radioGroupClass}>
                {["Very well", "Generally well", "Sometimes struggles", "Often struggles"].map((o) => (
                  <button key={o} type="button" onClick={() => setPeerInteraction(o.toLowerCase())} className={radioClass(peerInteraction === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Eye contact / responding to others</label>
              <div className={radioGroupClass}>
                {["Yes", "Sometimes", "No"].map((o) => (
                  <button key={o} type="button" onClick={() => setEyeContact(o.toLowerCase())} className={radioClass(eyeContact === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Attention/focus concerns</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setAttentionConcerns("no")} className={yesNoClass(attentionConcerns, "no")}>No</button>
                <button type="button" onClick={() => setAttentionConcerns("yes")} className={yesNoClass(attentionConcerns, "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Behavior/emotional concerns</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setBehaviorConcerns("no")} className={yesNoClass(behaviorConcerns, "no")}>No</button>
                <button type="button" onClick={() => setBehaviorConcerns("yes")} className={yesNoClass(behaviorConcerns, "yes")}>Yes</button>
              </div>
              {behaviorConcerns === "yes" && (
                <textarea value={behaviorDesc} onChange={(e) => setBehaviorDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>School / Grade</label>
              <input value={schoolGrade} onChange={(e) => setSchoolGrade(e.target.value)} className={inputClass} placeholder="e.g. Lincoln Elementary, 2nd grade" />
            </div>
            <div>
              <label className={labelClass}>Academic concerns?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setAcademicConcerns("no")} className={yesNoClass(academicConcerns, "no")}>No</button>
                <button type="button" onClick={() => setAcademicConcerns("yes")} className={yesNoClass(academicConcerns, "yes")}>Yes</button>
              </div>
              {academicConcerns === "yes" && (
                <textarea value={academicConcernsDesc} onChange={(e) => setAcademicConcernsDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Strengths (what your child does well)</label>
              <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Areas of concern</label>
              <textarea value={areasOfConcern} onChange={(e) => setAreasOfConcern(e.target.value)} rows={2} className={inputClass} />
            </div>
            <div className="border-t border-sage/10 pt-4">
              <p className="font-body text-[13px] font-semibold text-charcoal mb-3">Family History</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Speech/language difficulties in family?</label>
                  <div className={radioGroupClass}>
                    <button type="button" onClick={() => setFamilySpeech("no")} className={yesNoClass(familySpeech, "no")}>No</button>
                    <button type="button" onClick={() => setFamilySpeech("yes")} className={yesNoClass(familySpeech, "yes")}>Yes</button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Learning disabilities in family?</label>
                  <div className={radioGroupClass}>
                    <button type="button" onClick={() => setFamilyLearning("no")} className={yesNoClass(familyLearning, "no")}>No</button>
                    <button type="button" onClick={() => setFamilyLearning("yes")} className={yesNoClass(familyLearning, "yes")}>Yes</button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Hearing loss in family?</label>
                  <div className={radioGroupClass}>
                    <button type="button" onClick={() => setFamilyHearing("no")} className={yesNoClass(familyHearing, "no")}>No</button>
                    <button type="button" onClick={() => setFamilyHearing("yes")} className={yesNoClass(familyHearing, "yes")}>Yes</button>
                  </div>
                </div>
                {(familySpeech === "yes" || familyLearning === "yes" || familyHearing === "yes") && (
                  <div>
                    <label className={labelClass}>Please explain</label>
                    <textarea value={familyExplain} onChange={(e) => setFamilyExplain(e.target.value)} rows={2} className={inputClass} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>What are your main concerns about your child&apos;s communication?</label>
              <textarea value={mainConcerns} onChange={(e) => setMainConcerns(e.target.value)} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>What would you like your child to improve?</label>
              <textarea value={improvementGoals} onChange={(e) => setImprovementGoals(e.target.value)} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Is there anything else you would like us to know?</label>
              <textarea value={anythingElse} onChange={(e) => setAnythingElse(e.target.value)} rows={3} className={inputClass} />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div ref={ref} className="min-h-screen bg-warm-white">
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(170,195,192,0.3)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105">
              <Image src="/Logo.png" alt="Conscious Speech Strategies" fill className="object-cover" sizes="40px" />
            </div>
            <span className="font-serif text-lg font-medium tracking-wide text-charcoal">Conscious Speech</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 font-body text-[13px] font-semibold uppercase tracking-[0.15em] text-charcoal-light transition-colors duration-300 hover:text-sage-dark">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pb-24">
        <div className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-sage/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-peach/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8 text-center">
          <div className="fade-up mx-auto mb-6 h-[1px] w-12 bg-sage" />
          <p className="fade-up delay-1 mb-4 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
            Private Services
          </p>
          <h1 className="fade-up delay-2 font-serif text-4xl font-light text-charcoal md:text-5xl lg:text-6xl">
            Summer Therapy &<br />
            <span className="italic">Private</span> Services
          </h1>
          <p className="fade-up delay-3 mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-charcoal-light md:text-lg">
            Individualized and group therapy options designed to support your child&apos;s communication growth over the summer and beyond.
          </p>
        </div>
      </section>

      {/* Service Details & Pricing */}
      <section className="relative bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">What We Offer</p>
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              Services & <span className="italic">Pricing</span>
            </h2>
          </div>

          <div className="fade-up delay-1 grid gap-6 md:grid-cols-2 mb-10">
            {/* Evaluations */}
            <div className="rounded-2xl bg-warm-white p-7">
              <h3 className="mb-4 font-serif text-xl font-light text-charcoal">Evaluations</h3>
              <p className="mb-4 font-body text-sm leading-relaxed text-charcoal-light">
                Comprehensive evaluations to identify your child&apos;s strengths and areas of need. Students will need to be evaluated unless they have an IEP, in which case we can follow the IEP. You may still request an evaluation if desired.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-sage/10">
                  <span className="font-body text-sm text-charcoal">Speech Evaluation</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$275</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-sage/10">
                  <span className="font-body text-sm text-charcoal">Language Evaluation</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$350</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-body text-sm text-charcoal">Fluency Evaluation</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$350</span>
                </div>
              </div>
            </div>

            {/* Therapy */}
            <div className="rounded-2xl bg-warm-white p-7">
              <h3 className="mb-4 font-serif text-xl font-light text-charcoal">Therapy Sessions</h3>
              <p className="mb-4 font-body text-sm leading-relaxed text-charcoal-light">
                All sessions are 30 minutes and may be scheduled up to twice a week if needed. Available in-person at SLAM Apollo or a private residence in St. Petersburg, or virtually for qualifying candidates.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-sage/10">
                  <span className="font-body text-sm text-charcoal">Individualized Session (30 min)</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$65</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-body text-sm text-charcoal">Group Therapy (2+ students, 30 min)</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$35</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="fade-up delay-2 grid gap-4 md:grid-cols-3">
            {[
              { title: "In Person", desc: "Sessions at SLAM Apollo or a private residence in St. Petersburg." },
              { title: "Virtual Option", desc: "Available for students determined to be good candidates for teletherapy." },
              { title: "Flexible Schedule", desc: "30-minute sessions, up to twice weekly based on your child's needs." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl bg-warm-white p-6 text-center">
                <h4 className="mb-2 font-serif text-lg font-light text-charcoal">{s.title}</h4>
                <p className="font-body text-sm leading-relaxed text-charcoal-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questionnaire Form */}
      <section id="questionnaire" className="relative py-16 md:py-20">
        <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-sage/10 blur-3xl" />
        <div className="mx-auto max-w-2xl px-6 lg:px-8">
          <div className="fade-up text-center mb-10">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">Get Started</p>
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              Speech & Language <span className="italic">Questionnaire</span>
            </h2>
            <p className="font-body text-base leading-relaxed text-charcoal-light">
              Complete this questionnaire to help us understand your child&apos;s needs and get started with services.
            </p>
          </div>

          {submitted ? (
            <div className="fade-up rounded-2xl bg-cream p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/20">
                <svg className="h-7 w-7 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="mb-2 font-serif text-2xl font-light text-charcoal">Thank You!</h3>
              <p className="font-body text-sm text-charcoal-light">
                We&apos;ve received your questionnaire and will be in touch soon to discuss your child&apos;s needs and next steps.
              </p>
            </div>
          ) : (
            <div className="fade-up delay-1">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-body text-xs text-sage-dark font-semibold uppercase tracking-wider">
                    Step {step + 1} of {TOTAL_STEPS}: {stepTitles[step]}
                  </span>
                  <span className="font-body text-xs text-charcoal-light">{Math.round(((step + 1) / TOTAL_STEPS) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-sage/10 rounded-full overflow-hidden">
                  <div className="h-full bg-sage rounded-full transition-all duration-500" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
                </div>
              </div>

              <div className="rounded-2xl bg-cream p-7 space-y-6">
                {renderStep()}

                {/* Navigation */}
                <div className="flex gap-3 pt-2 border-t border-sage/10">
                  {step > 0 && (
                    <button type="button" onClick={() => setStep(step - 1)}
                      className="px-6 py-3 rounded-xl font-body text-sm font-semibold text-charcoal-light hover:bg-warm-white transition-all cursor-pointer">
                      Back
                    </button>
                  )}
                  <div className="ml-auto">
                    {step < TOTAL_STEPS - 1 ? (
                      <button type="button" onClick={() => setStep(step + 1)}
                        className="rounded-xl bg-sage px-6 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20 cursor-pointer">
                        Next
                      </button>
                    ) : (
                      <button type="button" onClick={handleSubmit} disabled={submitting}
                        className="rounded-xl bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20 disabled:opacity-50 cursor-pointer">
                        {submitting ? "Submitting..." : "Submit Questionnaire"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sage/10 bg-warm-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center lg:px-8">
          <p className="font-body text-xs text-charcoal-light">
            &copy; {new Date().getFullYear()} Conscious Speech Strategies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify the form works**

Run `npm run dev`, navigate to `/services`, and test:
- Pricing section renders correctly
- Multi-step form navigates forward and back
- Service selection conditionally shows eval types and therapy types
- All 9 steps render their fields properly
- Submit button on final step calls Supabase

- [ ] **Step 3: Commit**

```bash
git add src/app/services/page.tsx
git commit -m "feat: rewrite private services page with pricing, summer therapy info, and multi-step questionnaire"
```

---

### Task 4: Category-Based Hour Logging for SLAM Tampa Schools

**Files:**
- Modify: `src/app/admin/hours/new/page.tsx`

The current behavior: when "SLAM Tampa" is selected, a single category dropdown appears. The new behavior: when "SLAM Tampa Elem" (district 7824) or "SLAM Tampa Middle/High" (district 7815) is selected, the time_in/time_out fields are replaced with a list of category+hours rows. The user can add multiple categories with hours for each. Total hours is the sum of all category hours.

New categories:
- Speech Lang TX
- Therapy Prep
- Caseload Scheduling/Management
- IEP/Eval Meeting Prep/Paperwork
- IEP/Eval/Conference Meeting
- ESE Team Consult
- Teacher/Parent Consult
- Evals or Screenings
- Training
- Data Recording

- [ ] **Step 1: Rewrite the Log Hours page**

Replace the entire content of `src/app/admin/hours/new/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { computeHours } from "@/lib/utils";
import type { School } from "@/lib/supabase/types";

const SLAM_TAMPA_CATEGORIES = [
  "Speech Lang TX",
  "Therapy Prep",
  "Caseload Scheduling/Management",
  "IEP/Eval Meeting Prep/Paperwork",
  "IEP/Eval/Conference Meeting",
  "ESE Team Consult",
  "Teacher/Parent Consult",
  "Evals or Screenings",
  "Training",
  "Data Recording",
];

const SLAM_TAMPA_NAMES = ["SLAM Tampa Elem", "SLAM Tampa Middle/High"];

interface CategoryRow {
  category: string;
  hours: string;
}

export default function LogHoursPage() {
  const supabase = createClient();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    school_id: "",
    date: new Date().toISOString().split("T")[0],
    time_in: "",
    time_out: "",
    description: "",
    category: "",
  });
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([{ category: "", hours: "" }]);

  const selectedSchool = schools.find((s) => s.id === form.school_id);
  const isSlamTampa = selectedSchool ? SLAM_TAMPA_NAMES.includes(selectedSchool.name) : false;

  // For non-SLAM Tampa schools
  const totalHours = isSlamTampa ? null : computeHours(form.time_in, form.time_out);
  const timeError = !isSlamTampa && form.time_in && form.time_out && totalHours === null ? "Time out must be after time in." : null;

  // For SLAM Tampa schools
  const categoryTotal = categoryRows.reduce((sum, r) => {
    const h = parseFloat(r.hours);
    return sum + (isNaN(h) ? 0 : h);
  }, 0);

  useEffect(() => {
    supabase.from("schools").select("*").order("name").then(({ data }) => {
      if (data) setSchools(data);
    });
  }, []);

  function addCategoryRow() {
    setCategoryRows([...categoryRows, { category: "", hours: "" }]);
  }

  function updateCategoryRow(index: number, field: keyof CategoryRow, value: string) {
    const updated = [...categoryRows];
    updated[index] = { ...updated[index], [field]: value };
    setCategoryRows(updated);
  }

  function removeCategoryRow(index: number) {
    if (categoryRows.length <= 1) return;
    setCategoryRows(categoryRows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isSlamTampa) {
      // Insert one row per category
      const validRows = categoryRows.filter((r) => r.category && r.hours && parseFloat(r.hours) > 0);
      if (validRows.length === 0) {
        alert("Please add at least one category with hours.");
        return;
      }
      setSaving(true);

      const inserts = validRows.map((r) => ({
        user_id: user.id,
        school_id: form.school_id,
        date: form.date,
        hours: parseFloat(r.hours),
        time_in: null,
        time_out: null,
        description: form.description || null,
        category: r.category,
      }));

      const { error } = await supabase.from("hours").insert(inserts);
      if (error) {
        alert("Error logging hours: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      if (totalHours === null) return;
      setSaving(true);

      const { error } = await supabase.from("hours").insert({
        user_id: user.id,
        school_id: form.school_id,
        date: form.date,
        hours: totalHours,
        time_in: form.time_in,
        time_out: form.time_out,
        description: form.description || null,
        category: form.category || null,
      });

      if (error) {
        alert("Error logging hours: " + error.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/hours");
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Log Hours</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School *</label>
          <select required value={form.school_id} onChange={(e) => {
              const newId = e.target.value;
              setForm({ ...form, school_id: newId, category: "" });
              setCategoryRows([{ category: "", hours: "" }]);
            }}
            className={`${inputClass} cursor-pointer`}>
            <option value="">Select a school...</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Date *</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
        </div>

        {isSlamTampa ? (
          <>
            {/* Category-based hours */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-2">Hours by Category *</label>
              <div className="space-y-2">
                {categoryRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <select value={row.category} onChange={(e) => updateCategoryRow(i, "category", e.target.value)}
                      className={`${inputClass} flex-1 cursor-pointer`}>
                      <option value="">Select category...</option>
                      {SLAM_TAMPA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" step="0.25" min="0" value={row.hours}
                      onChange={(e) => updateCategoryRow(i, "hours", e.target.value)}
                      placeholder="Hrs" className={`${inputClass} w-20`} />
                    {categoryRows.length > 1 && (
                      <button type="button" onClick={() => removeCategoryRow(i)}
                        className="p-2.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addCategoryRow}
                className="mt-2 flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-[13px] font-medium transition-colors cursor-pointer">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add More Hours
              </button>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-teal-700 uppercase tracking-wide">Total Hours</span>
              <span className="text-teal-700 font-semibold tabular-nums text-[15px]">
                {categoryTotal > 0 ? categoryTotal.toFixed(2) : "\u2014"}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Standard time-based entry */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Time In *</label>
                <input type="time" required value={form.time_in}
                  onChange={(e) => setForm({ ...form, time_in: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Time Out *</label>
                <input type="time" required value={form.time_out}
                  onChange={(e) => setForm({ ...form, time_out: e.target.value })}
                  className={inputClass} />
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-teal-700 uppercase tracking-wide">Total Hours</span>
              <span className="text-teal-700 font-semibold tabular-nums text-[15px]">
                {totalHours !== null ? totalHours.toFixed(2) : timeError ? <span className="text-red-600 text-[12px] font-medium normal-case tracking-normal">{timeError}</span> : "\u2014"}
              </span>
            </div>
          </>
        )}

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..." className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving || (!isSlamTampa && totalHours === null) || (isSlamTampa && categoryTotal === 0)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Log Hours"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/hours/new/page.tsx
git commit -m "feat: category-based hour logging for SLAM Tampa Elem and Middle/High"
```

---

### Task 5: Category-Based Hour Editing for SLAM Tampa Schools

**Files:**
- Modify: `src/app/admin/hours/[id]/edit/page.tsx`

The edit page needs the same category-aware behavior. Since individual hour entries already have a category column, editing a single entry just needs to show the right category dropdown for SLAM Tampa schools instead of the old generic one.

- [ ] **Step 1: Update the Edit Hours page**

Update the constants and logic to match the new page. The key changes:
1. Replace `hourCategories` with `SLAM_TAMPA_CATEGORIES`
2. Replace `showCategory = selectedSchool?.name === "SLAM Tampa"` with `isSlamTampa = SLAM_TAMPA_NAMES.includes(selectedSchool?.name)`
3. When editing an existing SLAM Tampa entry, show category dropdown with new categories (single entry editing, not multi-row — the multi-row is only for creation)
4. For SLAM Tampa entries, make time_in/time_out optional (they may be null) and allow editing hours directly

The edit page edits a single `hours` row, so it should show:
- For SLAM Tampa: category dropdown (required) + direct hours input (no time_in/time_out)
- For other schools: time_in/time_out + computed hours (existing behavior)

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { computeHours } from "@/lib/utils";
import type { School } from "@/lib/supabase/types";

const SLAM_TAMPA_CATEGORIES = [
  "Speech Lang TX",
  "Therapy Prep",
  "Caseload Scheduling/Management",
  "IEP/Eval Meeting Prep/Paperwork",
  "IEP/Eval/Conference Meeting",
  "ESE Team Consult",
  "Teacher/Parent Consult",
  "Evals or Screenings",
  "Training",
  "Data Recording",
];

const SLAM_TAMPA_NAMES = ["SLAM Tampa Elem", "SLAM Tampa Middle/High"];

export default function EditHoursPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [schools, setSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    school_id: "",
    date: "",
    time_in: "",
    time_out: "",
    hours: "",
    description: "",
    category: "",
  });

  const selectedSchool = schools.find((s) => s.id === form.school_id);
  const isSlamTampa = selectedSchool ? SLAM_TAMPA_NAMES.includes(selectedSchool.name) : false;
  const totalHours = isSlamTampa ? null : computeHours(form.time_in, form.time_out);
  const timeError = !isSlamTampa && form.time_in && form.time_out && totalHours === null ? "Time out must be after time in." : null;
  const directHours = isSlamTampa ? parseFloat(form.hours) || 0 : null;

  useEffect(() => {
    async function load() {
      const [{ data: entry }, { data: sc }] = await Promise.all([
        supabase.from("hours").select("*").eq("id", id).single(),
        supabase.from("schools").select("*").order("name"),
      ]);

      if (sc) setSchools(sc);
      if (entry) {
        setForm({
          school_id: entry.school_id || "",
          date: entry.date || "",
          time_in: entry.time_in || "",
          time_out: entry.time_out || "",
          hours: entry.hours?.toString() || "",
          description: entry.description || "",
          category: entry.category || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSlamTampa) {
      if (!directHours || directHours <= 0) return;
      setSaving(true);

      const { error } = await supabase.from("hours").update({
        school_id: form.school_id,
        date: form.date,
        hours: directHours,
        time_in: null,
        time_out: null,
        description: form.description || null,
        category: form.category || null,
      }).eq("id", id);

      if (error) {
        alert("Error updating hours: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      if (totalHours === null) return;
      setSaving(true);

      const { error } = await supabase.from("hours").update({
        school_id: form.school_id,
        date: form.date,
        hours: totalHours,
        time_in: form.time_in,
        time_out: form.time_out,
        description: form.description || null,
        category: form.category || null,
      }).eq("id", id);

      if (error) {
        alert("Error updating hours: " + error.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/hours");
  }

  async function handleDelete() {
    if (!confirm("Delete this hours entry?")) return;
    setDeleting(true);

    const { error } = await supabase.from("hours").delete().eq("id", id);
    if (error) {
      alert("Error deleting: " + error.message);
      setDeleting(false);
      return;
    }

    router.push("/admin/hours");
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  if (loading) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Edit Hours</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School *</label>
          <select required value={form.school_id} onChange={(e) => {
              const newId = e.target.value;
              const newSchool = schools.find((s) => s.id === newId);
              const newIsSlamTampa = newSchool ? SLAM_TAMPA_NAMES.includes(newSchool.name) : false;
              setForm({ ...form, school_id: newId, category: newIsSlamTampa ? form.category : "" });
            }}
            className={`${inputClass} cursor-pointer`}>
            <option value="">Select a school...</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Date *</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
        </div>

        {isSlamTampa ? (
          <>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Category *</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={`${inputClass} cursor-pointer`}>
                <option value="">Select category...</option>
                {SLAM_TAMPA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Hours *</label>
              <input type="number" step="0.25" min="0" required value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="e.g. 2.5" className={inputClass} />
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-teal-700 uppercase tracking-wide">Total Hours</span>
              <span className="text-teal-700 font-semibold tabular-nums text-[15px]">
                {directHours && directHours > 0 ? directHours.toFixed(2) : "\u2014"}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Time In *</label>
                <input type="time" required value={form.time_in}
                  onChange={(e) => setForm({ ...form, time_in: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Time Out *</label>
                <input type="time" required value={form.time_out}
                  onChange={(e) => setForm({ ...form, time_out: e.target.value })}
                  className={inputClass} />
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-teal-700 uppercase tracking-wide">Total Hours</span>
              <span className="text-teal-700 font-semibold tabular-nums text-[15px]">
                {totalHours !== null ? totalHours.toFixed(2) : timeError ? <span className="text-red-600 text-[12px] font-medium normal-case tracking-normal">{timeError}</span> : "\u2014"}
              </span>
            </div>
          </>
        )}

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..." className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving || (!isSlamTampa && totalHours === null) || (isSlamTampa && (!directHours || directHours <= 0))}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Update Hours"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="ml-auto px-4 py-2.5 rounded-lg font-medium text-[13px] text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/hours/[id]/edit/page.tsx
git commit -m "feat: category-based hour editing for SLAM Tampa schools"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run build to check for TypeScript errors**

```bash
cd site && npm run build
```

Fix any type errors that appear.

- [ ] **Step 2: Visual QA checklist**

Run `npm run dev` and verify:
1. Home page → Services section has "Want One-on-One Service?" button → links to /services
2. /services page → Pricing cards show correct amounts → Questionnaire navigates all 9 steps → Submit works
3. /admin/hours/new → Select a non-SLAM school → shows time_in/time_out (unchanged)
4. /admin/hours/new → Select "SLAM Tampa Elem" or "SLAM Tampa Middle/High" → shows category+hours rows with "Add More Hours" button
5. /admin/hours/[id]/edit → SLAM Tampa entry shows category dropdown + direct hours input
6. /admin/hours/[id]/edit → Non-SLAM entry shows time_in/time_out (unchanged)

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build errors and polish"
```
