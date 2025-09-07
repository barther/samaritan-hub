import { Heart } from "lucide-react";

const Hero = () => {
  return (
    <section 
      className="relative isolate py-20 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--emerald-50)),transparent),radial-gradient(ellipse_at_bottom_right,hsl(var(--indigo-50)),transparent)]"
      role="region"
      aria-labelledby="hero-headline"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Icon Badge */}
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
            <Heart className="h-6 w-6 text-primary" />
          </div>

          {/* Headlines */}
          <h1 
            id="hero-headline"
            className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
          >
            We help neighbors in their time of need
          </h1>
          
          <p className="mt-2 text-base text-muted-foreground">
            Because no one should face hardship alone.
          </p>

          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Good Samaritan at Lithia Springs Methodist Church provides short-term, case-by-case assistance 
            (rent, utilities, food, transport). We listen first, verify needs, and connect people with the 
            most fitting help—whether through our fund or trusted community resources.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;