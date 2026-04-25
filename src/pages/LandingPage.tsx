import Header from './landing/Header';
import Hero from './landing/Hero';
import HowItWorks from './landing/HowItWorks';
import Features from './landing/Features';
import Comparison from './landing/Comparison';
import Benefits from './landing/Benefits';
import SocialProof from './landing/SocialProof';
import Pricing from './landing/Pricing';
import ContactForm from './landing/ContactForm';
import Footer from './landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-50">
      <Header />
      <Hero />
      <HowItWorks />
      <Features />
      <Comparison />
      <Benefits />
      <SocialProof />
      <Pricing />
      <ContactForm />
      <Footer />
    </div>
  );
}
