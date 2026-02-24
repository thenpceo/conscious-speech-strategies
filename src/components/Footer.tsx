"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-charcoal py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full brightness-110">
              <Image
                src="/Logo.png"
                alt="Conscious Speech Strategies"
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <span className="font-serif text-xl font-light tracking-wide text-cream">
              Conscious Speech Strategies
            </span>
          </div>

          {/* Tagline */}
          <p className="mb-8 max-w-md font-body text-sm leading-relaxed text-cream/50">
            Holistic speech-language therapy integrating mind, body, and spirit.
            Empowering children&apos;s communication in Gulfport, FL.
          </p>

          {/* Nav links */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-6">
            {["About", "Approach", "Services", "Programs", "Contact"].map(
              (link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="font-body text-xs font-medium uppercase tracking-[0.15em] text-cream/40 transition-colors duration-300 hover:text-sage-light"
                >
                  {link}
                </a>
              )
            )}
          </div>

          {/* Divider */}
          <div className="mb-6 h-[1px] w-16 bg-cream/10" />

          <p className="font-body text-[11px] text-cream/30">
            &copy; {new Date().getFullYear()} Conscious Speech Strategies. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
