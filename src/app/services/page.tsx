"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useReveal } from "@/hooks/useReveal";

export default function ServicesPage() {
  const ref = useReveal();
  const supabase = createClient();
  const [form, setForm] = useState({
    parent_name: "",
    email: "",
    phone: "",
    child_name: "",
    child_age: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email && !form.phone) {
      alert("Please provide at least an email or phone number so we can reach you.");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("inquiries").insert({
      parent_name: form.parent_name,
      email: form.email || null,
      phone: form.phone || null,
      child_name: form.child_name || null,
      child_age: form.child_age || null,
      message: form.message || null,
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
            Our Services
          </p>
          <h1 className="fade-up delay-2 font-serif text-4xl font-light text-charcoal md:text-5xl lg:text-6xl">
            Personalized Speech &<br />
            <span className="italic">Language</span> Therapy
          </h1>
          <p className="fade-up delay-3 mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-charcoal-light md:text-lg">
            Holistic, individualized therapy services designed to empower your child&apos;s unique communication journey.
          </p>
        </div>
      </section>

      {/* Private Services */}
      <section className="relative bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">Private Services</p>
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              One-on-One <span className="italic">Therapy</span>
            </h2>
            <p className="font-body text-base leading-relaxed text-charcoal-light">
              Individualized sessions tailored to your child&apos;s specific needs, goals, and learning style. Our holistic approach integrates mind, body, and spirit for lasting results.
            </p>
          </div>
          <div className="fade-up delay-1 grid gap-6 md:grid-cols-3">
            {[
              { title: "Speech Sound Disorders", desc: "Articulation therapy, phonological processes, and motor speech support using creative, play-based methods." },
              { title: "Language Development", desc: "Expressive and receptive language therapy to build vocabulary, grammar, narrative, and social communication skills." },
              { title: "Executive Functioning", desc: "Support for organization, planning, self-regulation, and cognitive flexibility through engaging activities." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl bg-warm-white p-7 transition-all duration-300 hover:shadow-md hover:shadow-sage/10">
                <h3 className="mb-2 font-serif text-xl font-light text-charcoal">{s.title}</h3>
                <p className="font-body text-sm leading-relaxed text-charcoal-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Group Classes */}
      <section className="relative py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-olive">Group Programs</p>
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              Group <span className="italic">Classes</span>
            </h2>
            <p className="font-body text-base leading-relaxed text-charcoal-light">
              Small group sessions where children learn from each other, build social skills, and practice communication in a supportive, fun environment.
            </p>
          </div>
          <div className="fade-up delay-1 grid gap-6 md:grid-cols-2">
            {[
              { title: "Social Skills Groups", desc: "Practice conversation, turn-taking, perspective-taking, and friendship skills through interactive games and role play." },
              { title: "Literacy & Language Groups", desc: "Phonological awareness, reading comprehension, and written expression through creative, multisensory activities." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl bg-cream p-7 transition-all duration-300 hover:shadow-md hover:shadow-sage/10">
                <h3 className="mb-2 font-serif text-xl font-light text-charcoal">{s.title}</h3>
                <p className="font-body text-sm leading-relaxed text-charcoal-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Intake Form */}
      <section id="intake" className="relative bg-cream py-16 md:py-20">
        <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-sage/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 items-start">
            <div className="fade-up">
              <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">Get Started</p>
              <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
                Want to be a <span className="italic">private student?</span>
              </h2>
              <p className="mb-6 font-body text-base leading-relaxed text-charcoal-light">
                Fill out the intake form and we&apos;ll reach out to discuss your child&apos;s needs, schedule a consultation, and begin creating a personalized plan.
              </p>
              <div className="space-y-3 font-body text-sm text-charcoal-light">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/20">
                    <svg className="h-3 w-3 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p>Free initial consultation to discuss your child&apos;s needs</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/20">
                    <svg className="h-3 w-3 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p>Personalized therapy plan tailored to your child</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/20">
                    <svg className="h-3 w-3 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p>Flexible scheduling — in-person or teletherapy options</p>
                </div>
              </div>
            </div>

            <div className="fade-up delay-2">
              {submitted ? (
                <div className="rounded-2xl bg-warm-white p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/20">
                    <svg className="h-7 w-7 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="mb-2 font-serif text-2xl font-light text-charcoal">Thank You!</h3>
                  <p className="font-body text-sm text-charcoal-light">
                    We&apos;ve received your information and will be in touch soon to discuss your child&apos;s needs.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-2xl bg-warm-white p-7 space-y-4 shadow-sm">
                  <h3 className="font-serif text-xl font-light text-charcoal mb-2">Intake Form</h3>
                  <div>
                    <label className="block font-body text-[12px] font-semibold uppercase tracking-wider text-sage-dark mb-1.5">Your Name *</label>
                    <input required value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} className={inputClass} placeholder="Parent / Guardian name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-body text-[12px] font-semibold uppercase tracking-wider text-sage-dark mb-1.5">Email</label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="your@email.com" />
                    </div>
                    <div>
                      <label className="block font-body text-[12px] font-semibold uppercase tracking-wider text-sage-dark mb-1.5">Phone</label>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="(555) 555-5555" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-body text-[12px] font-semibold uppercase tracking-wider text-sage-dark mb-1.5">Child&apos;s Name</label>
                      <input value={form.child_name} onChange={(e) => setForm({ ...form, child_name: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block font-body text-[12px] font-semibold uppercase tracking-wider text-sage-dark mb-1.5">Child&apos;s Age</label>
                      <input value={form.child_age} onChange={(e) => setForm({ ...form, child_age: e.target.value })} className={inputClass} placeholder="e.g. 7" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-body text-[12px] font-semibold uppercase tracking-wider text-sage-dark mb-1.5">Message / Notes</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className={inputClass} placeholder="Tell us about your child's needs..." />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full rounded-xl bg-sage px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20 disabled:opacity-50 cursor-pointer">
                    {submitting ? "Submitting..." : "Submit Intake Form"}
                  </button>
                </form>
              )}
            </div>
          </div>
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
