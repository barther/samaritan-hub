const Testimonial = () => {
  // Show by default (can be feature-flagged later if needed)
  const showTestimonial = true;
  
  if (!showTestimonial) return null;

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-slate-600 font-medium text-lg">T</span>
              </div>
            </div>
            
            <blockquote className="text-lg text-foreground mb-4">
              "I didn't know where to start. They listened and helped me find a plan."
            </blockquote>
            
            <p className="text-muted-foreground">
              — Tanya, Neighbor
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;