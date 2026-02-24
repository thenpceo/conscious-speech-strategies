"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const links = [
  { href: "#about", label: "About" },
  { href: "#approach", label: "Our Approach" },
  { href: "#services", label: "Services" },
  { href: "#programs", label: "Programs" },
  { href: "#contact", label: "Contact" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-warm-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(170,195,192,0.3)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/Logo.png"
              alt="Conscious Speech Strategies"
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <span
            className={`font-serif text-lg font-medium tracking-wide transition-colors duration-500 ${
              scrolled ? "text-charcoal" : "text-charcoal"
            }`}
          >
            Conscious Speech
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative font-body text-[13px] font-semibold uppercase tracking-[0.15em] text-charcoal-light transition-colors duration-300 hover:text-sage-dark after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 after:bg-sage after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="relative z-50 flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-[1.5px] w-5 bg-charcoal transition-all duration-300 ${
              mobileOpen ? "translate-y-[6.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] w-5 bg-charcoal transition-all duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] w-5 bg-charcoal transition-all duration-300 ${
              mobileOpen ? "-translate-y-[6.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-warm-white transition-all duration-500 md:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-full flex-col items-center justify-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-serif text-3xl font-light text-charcoal transition-colors duration-300 hover:text-sage-dark"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
