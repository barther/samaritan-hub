import Header from "@/components/Header";
import Hero from "@/components/landing/Hero";
import EnhancedMonthlyStats from "@/components/landing/EnhancedMonthlyStats";
import PrimaryCTAs from "@/components/landing/PrimaryCTAs";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonial from "@/components/landing/Testimonial";
import FooterTrust from "@/components/landing/FooterTrust";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <Hero />
      
      <div className="container mx-auto px-4 space-y-6 py-8 max-w-2xl">
        <EnhancedMonthlyStats />
        
        {/* Disclaimer */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 text-center">
            <strong>Please note:</strong> Assistance is not guaranteed and depends on policy and available funds.
          </p>
        </div>

        <PrimaryCTAs />
      </div>

      <HowItWorks />
      <Testimonial />
      <FooterTrust />
    </div>
  );
};

export default Index;
