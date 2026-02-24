import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Approach from "@/components/Approach";
import Services from "@/components/Services";
import Programs from "@/components/Programs";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <About />
        <Approach />
        <Services />
        <Programs />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
