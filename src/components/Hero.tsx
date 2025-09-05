import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, HandHeart } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Mission Statement */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              We help neighbors in real need
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Good Samaritan at Lithia Springs Methodist Church provides short-term, case-by-case assistance 
              (rent, utilities, food, transport). We listen first, verify needs, and connect people with the 
              most fitting help—whether through our fund or trusted community resources.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="bg-muted/50 rounded-lg p-4 mb-8 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Please note:</strong> Assistance is not guaranteed and depends on policy and available funds.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild variant="donation" size="lg" className="min-w-[200px]">
              <Link to="/give">
                <Heart className="mr-2 h-5 w-5" />
                Give
              </Link>
            </Button>
            <Button asChild variant="assistance" size="lg" className="min-w-[200px]">
              <Link to="/request">
                <HandHeart className="mr-2 h-5 w-5" />
                Request Assistance
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-primary rounded-full blur-3xl opacity-10 -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-gradient-hero rounded-full blur-3xl opacity-10 translate-x-1/2"></div>
    </section>
  );
};

export default Hero;