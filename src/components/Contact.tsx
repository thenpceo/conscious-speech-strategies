"use client";

import { useReveal } from "@/hooks/useReveal";

export default function Contact() {
  const ref = useReveal();

  return (
    <section
      id="contact"
      ref={ref}
      className="relative overflow-hidden bg-cream py-24 md:py-32"
    >
      {/* Decorative */}
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-sage/8" />
      <div className="pointer-events-none absolute -top-20 -right-20 h-[300px] w-[300px] rounded-full bg-peach/10" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-16 md:grid-cols-2 md:gap-12 lg:gap-20">
          {/* Left side - Info */}
          <div className="slide-left">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
              Get in Touch
            </p>
            <h2 className="mb-6 font-serif text-4xl font-light text-charcoal md:text-5xl">
              Let&apos;s Begin the
              <br />
              <span className="italic">Journey</span>
            </h2>
            <p className="mb-10 max-w-md font-body text-base leading-relaxed text-charcoal-light md:text-[17px]">
              Whether your students are working on clear speech, social
              connection, language skills, or literacy &mdash; we&apos;re here
              to help them shine. Reach out to start the conversation.
            </p>

            {/* Contact details */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/10">
                  <svg
                    className="h-5 w-5 text-sage-dark"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-charcoal">
                    Location
                  </p>
                  <p className="font-body text-sm text-charcoal-light">
                    Gulfport, Florida
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/10">
                  <svg
                    className="h-5 w-5 text-sage-dark"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-charcoal">
                    Serving
                  </p>
                  <p className="font-body text-sm text-charcoal-light">
                    Schools & Private Groups
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative separator */}
            <div className="my-10 h-[1px] w-16 bg-sage/30" />

            <p className="font-body text-xs leading-relaxed text-charcoal-light/60">
              Conscious Speech Strategies provides school-based and private
              group speech therapy services throughout the greater Tampa Bay
              area.
            </p>
          </div>

          {/* Right side - Form */}
          <div className="slide-right">
            <form
              className="rounded-2xl bg-warm-white p-8 shadow-sm md:p-10"
              onSubmit={(e) => e.preventDefault()}
            >
              <h3 className="mb-6 font-serif text-2xl font-light text-charcoal">
                Send a Message
              </h3>

              <div className="mb-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-sage/20 bg-cream px-4 py-3 font-body text-sm text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-sage focus:ring-1 focus:ring-sage/30"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-sage/20 bg-cream px-4 py-3 font-body text-sm text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-sage focus:ring-1 focus:ring-sage/30"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-sage/20 bg-cream px-4 py-3 font-body text-sm text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-sage focus:ring-1 focus:ring-sage/30"
                  placeholder="your@email.com"
                />
              </div>

              <div className="mb-6">
                <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-lg border border-sage/20 bg-cream px-4 py-3 font-body text-sm text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-sage focus:ring-1 focus:ring-sage/30"
                  placeholder="Tell us about your child and how we can help..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-sage py-3.5 font-body text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
