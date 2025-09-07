import { Ear, ShieldCheck, Link as LinkIcon } from "lucide-react";

const HowItWorks = () => {
  // Component always shows - no environment variables needed
  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
              <Ear className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Listen</h3>
            <p className="text-muted-foreground">
              We listen to understand each situation.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Verify</h3>
            <p className="text-muted-foreground">
              We verify needs and eligibility.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
              <LinkIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Connect</h3>
            <p className="text-muted-foreground">
              We provide direct help or connect to trusted partners.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;