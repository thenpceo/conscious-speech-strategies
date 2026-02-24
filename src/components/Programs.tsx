"use client";

import Image from "next/image";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";

export default function Programs() {
  const ref = useReveal();

  return (
    <section
      id="programs"
      ref={ref}
      className="relative overflow-hidden bg-warm-white py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="fade-up mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
            Special Programs
          </p>
          <h2 className="mb-6 font-serif text-4xl font-light text-charcoal md:text-5xl">
            Beyond the <span className="italic">Session</span>
          </h2>
          <p className="font-body text-base leading-relaxed text-charcoal-light md:text-lg">
            Immersive programs that bring our holistic philosophy to life through
            extended group experiences.
          </p>
        </div>

        {/* Program cards */}
        <div className="grid gap-10 md:grid-cols-2 md:gap-8 lg:gap-12">
          {/* Mind Body Speech Camp */}
          <Link href="/camps/mind-body-speech" className="fade-up group relative block overflow-hidden rounded-2xl bg-cream transition-all duration-500 hover:shadow-xl hover:shadow-sage/10">
            {/* Image header */}
            <div className="relative h-56 overflow-hidden">
              <Image
                src="/images/rachel-reading.png"
                alt="Rachel reading with children during a therapy session"
                fill
                className="object-cover object-[50%_25%] transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/10 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <span className="inline-block rounded-full bg-sage/90 px-4 py-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  Summer Camp
                </span>
              </div>
            </div>

            <div className="p-7 md:p-8">
              <h3 className="mb-2 font-serif text-3xl font-light text-charcoal">
                Mind. Body. Speech.
              </h3>
              <p className="mb-5 font-body text-[15px] leading-[1.8] text-charcoal-light">
                Three weeks of creative group speech and language therapy sessions
                designed for rising 1st&ndash;5th graders looking to close the
                summer gap on their IEP goals and improve speech, language, social,
                literacy, and executive functioning skills.
              </p>

              {/* Details grid */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-warm-white p-3">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                    Schedule
                  </p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">
                    Mon&ndash;Thu, 9am&ndash;12pm
                  </p>
                </div>
                <div className="rounded-lg bg-warm-white p-3">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                    Investment
                  </p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">
                    $300 per week
                  </p>
                </div>
                <div className="rounded-lg bg-warm-white p-3">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                    Ages
                  </p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">
                    Rising 1st&ndash;5th Grade
                  </p>
                </div>
                <div className="rounded-lg bg-warm-white p-3">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                    Duration
                  </p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">
                    3 Week Series
                  </p>
                </div>
              </div>

              {/* Activities */}
              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  "Yoga",
                  "Improv Games",
                  "Mindfulness",
                  "Music",
                  "Drama",
                  "Literacy",
                  "Movement",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-sage/10 px-3 py-1 font-body text-xs font-medium text-sage-dark"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="inline-flex items-center gap-2 font-body text-sm font-semibold text-sage-dark transition-colors duration-300 group-hover:text-sage">
                Learn More
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </div>
          </Link>

          {/* Intuitive Ninja Training */}
          <div className="fade-up delay-2 group relative overflow-hidden rounded-2xl bg-cream transition-all duration-500 hover:shadow-xl hover:shadow-sage/10">
            {/* Image header */}
            <div className="relative h-56 overflow-hidden">
              <Image
                src="/images/rachel-child-2.jpg"
                alt="Rachel with a child during Intuitive Ninja Training"
                fill
                className="object-cover object-[50%_20%] transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/10 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <span className="inline-block rounded-full bg-olive/90 px-4 py-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  Ongoing Classes
                </span>
              </div>
            </div>

            <div className="p-7 md:p-8">
              <h3 className="mb-2 font-serif text-3xl font-light text-charcoal">
                Intuitive Ninja Training
              </h3>
              <p className="mb-5 font-body text-[15px] leading-[1.8] text-charcoal-light">
                Creative, movement-rich group classes that blend speech-language
                therapy with physical play. Children develop communication skills
                through engaging, full-body experiences that tap into their natural
                sense of adventure and curiosity.
              </p>

              <div className="mb-6 rounded-xl bg-warm-white p-5">
                <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                  What to Expect
                </p>
                <ul className="space-y-2">
                  {[
                    "Dynamic movement activities with themed props",
                    "Speech and language goals woven into play",
                    "Social skill building through group games",
                    "Mindfulness and body awareness exercises",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 font-body text-sm text-charcoal-light"
                    >
                      <div className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-olive" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-olive transition-colors duration-300 hover:text-olive-light"
              >
                Inquire About Classes
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
