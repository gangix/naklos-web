import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import Pricing from './landing/Pricing';
import FAQ from './landing/FAQ';
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
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
