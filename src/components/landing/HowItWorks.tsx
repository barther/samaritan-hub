import { Ear, ShieldCheck, Link as LinkIcon, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  // Component always shows - no environment variables needed
  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
          {/* Listen Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center flex-1 max-w-xs">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Ear className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Listen</h3>
            <p className="text-muted-foreground">
              We listen to understand each situation.
            </p>
          </div>

          {/* Arrow 1 */}
          <div className="hidden md:block text-slate-400">
            <ArrowRight className="h-6 w-6" />
          </div>
          <div className="md:hidden text-slate-400 rotate-90">
            <ArrowRight className="h-6 w-6" />
          </div>

          {/* Verify Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center flex-1 max-w-xs">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Verify</h3>
            <p className="text-muted-foreground">
              We verify needs and eligibility.
            </p>
          </div>

          {/* Arrow 2 */}
          <div className="hidden md:block text-slate-400">
            <ArrowRight className="h-6 w-6" />
          </div>
          <div className="md:hidden text-slate-400 rotate-90">
            <ArrowRight className="h-6 w-6" />
          </div>

          {/* Connect Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center flex-1 max-w-xs">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
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