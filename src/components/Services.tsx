"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const conditions = [
  "Articulation Delay",
  "Phonological Delay",
  "Stuttering",
  "Cluttering",
  "Language Delay",
  "Autism",
  "Literacy",
  "Dyslexia",
];

const qualities = [
  {
    title: "Evidence-Based",
    desc: "Rooted in best practices and current research",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
  },
  {
    title: "Playful & Personalized",
    desc: "Infused with creativity, joy, and movement",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
  },
  {
    title: "Neurodiversity-Affirming",
    desc: "Celebrating the whole child just as they are",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    title: "Collaborative",
    desc: "Ongoing caregiver support and partnership",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

export default function Services() {
  const ref = useReveal();

  return (
    <section
      id="services"
      ref={ref}
      className="relative overflow-hidden bg-sage/10 py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="fade-up mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
            Our Services
          </p>
          <h2 className="mb-6 font-serif text-4xl font-light text-charcoal md:text-5xl">
            How We <span className="italic">Help</span>
          </h2>
          <p className="font-body text-base leading-relaxed text-charcoal-light md:text-lg">
            We provide speech and language group therapy sessions in school and
            private settings, empowering every child to find their voice.
          </p>
        </div>

        <div className="grid gap-16 md:grid-cols-2 md:gap-12 lg:gap-20">
          {/* Left: Who we support */}
          <div className="slide-left">
            <h3 className="mb-6 font-serif text-2xl font-medium text-charcoal md:text-3xl">
              Who We Support
            </h3>
            <p className="mb-8 font-body text-[15px] leading-[1.8] text-charcoal-light">
              We work with children navigating a wide range of communication
              needs. Whether your child is working on clear speech, social
              connection, language skills, or literacy &mdash; we&apos;re here to
              help them shine.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {conditions.map((condition, i) => (
                <div
                  key={condition}
                  className={`fade-up delay-${Math.min(i + 1, 6)} flex items-center gap-3 rounded-xl bg-warm-white px-4 py-3 transition-all duration-300 hover:shadow-md hover:shadow-sage/10`}
                >
                  <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sage" />
                  <span className="font-body text-sm font-medium text-charcoal">
                    {condition}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: How we help */}
          <div className="slide-right">
            <h3 className="mb-6 font-serif text-2xl font-medium text-charcoal md:text-3xl">
              Our Therapy Sessions
            </h3>
            <div className="space-y-4">
              {qualities.map((q, i) => (
                <div
                  key={q.title}
                  className={`fade-up delay-${Math.min(i + 1, 6)} flex items-start gap-4 rounded-xl bg-warm-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sage/10`}
                >
                  <div className="flex-shrink-0 rounded-lg bg-sage/10 p-2.5 text-sage-dark">
                    {q.icon}
                  </div>
                  <div>
                    <h4 className="font-body text-[15px] font-bold text-charcoal">
                      {q.title}
                    </h4>
                    <p className="mt-1 font-body text-sm leading-relaxed text-charcoal-light">
                      {q.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Photo accent */}
            <div className="fade-up mt-8 overflow-hidden rounded-2xl">
              <Image
                src="/images/rachel-reading.png"
                alt="Rachel reading with children during a therapy session"
                width={600}
                height={400}
                className="h-52 w-full object-cover object-[50%_30%]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
