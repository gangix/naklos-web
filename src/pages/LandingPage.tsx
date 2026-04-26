import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import Comparison from './landing/Comparison';
import Pricing from './landing/Pricing';
import FAQ from './landing/FAQ';
import ContactForm from './landing/ContactForm';
import FinalCTA from './landing/FinalCTA';
import Footer from './landing/Footer';

const LandingPage = () => {
  return (
    <div className="bg-warm text-slate-900 antialiased">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <ContactForm />
      <Comparison />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
