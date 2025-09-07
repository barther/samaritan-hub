import { useEffect, useState } from "react";

const testimonials = [
  { quote: "I didn't know where to start. They listened and helped me find a plan.", name: "Tanya", initial: "T" },
  { quote: "When I lost my job, they helped with rent until I got back on my feet.", name: "Marcus", initial: "M" },
  { quote: "The kindness shown to my family during our hardest time was incredible.", name: "Sarah", initial: "S" },
  { quote: "They didn't just give money, they connected me with job resources too.", name: "David", initial: "D" },
  { quote: "No judgment, just genuine care and practical help when we needed it most.", name: "Lisa", initial: "L" },
  { quote: "They helped us keep our utilities on during a medical emergency.", name: "Robert", initial: "R" },
  { quote: "The process was respectful and they treated us with dignity.", name: "Maria", initial: "M" },
  { quote: "When our car broke down, they helped us get transportation to work.", name: "James", initial: "J" },
  { quote: "They listened to our whole story and found the right kind of help.", name: "Jennifer", initial: "J" },
  { quote: "Food assistance came at the perfect time for our growing family.", name: "Angela", initial: "A" },
  { quote: "They helped bridge the gap between losing one job and finding another.", name: "Kevin", initial: "K" },
  { quote: "The referrals they gave us opened doors we didn't know existed.", name: "Patricia", initial: "P" },
  { quote: "They made sure we understood all our options, not just the quick fix.", name: "Michael", initial: "M" },
  { quote: "When medical bills piled up, they helped us prioritize and find solutions.", name: "Linda", initial: "L" },
  { quote: "They connected us with resources that helped long after the immediate crisis.", name: "Christopher", initial: "C" },
  { quote: "The volunteers were so compassionate and understanding of our situation.", name: "Nancy", initial: "N" },
  { quote: "They helped us create a plan that got us back to independence.", name: "Daniel", initial: "D" },
  { quote: "When eviction was looming, they stepped in and gave us hope.", name: "Karen", initial: "K" },
  { quote: "They understood that sometimes good people just need a helping hand.", name: "Paul", initial: "P" },
  { quote: "The follow-up support made all the difference in our recovery.", name: "Betty", initial: "B" }
];

const Testimonial = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(testimonials[0]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Select a random testimonial on component mount
    const randomIndex = Math.floor(Math.random() * testimonials.length);
    setCurrentTestimonial(testimonials[randomIndex]);

    // Rotate testimonials every 8 seconds
    const interval = setInterval(() => {
      // Start fade out and lift animation
      setIsVisible(false);
      
      // After animation, change testimonial and fade back in
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * testimonials.length);
        setCurrentTestimonial(testimonials[randomIndex]);
        setIsVisible(true);
      }, 300);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className={`rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 transition-all duration-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}>
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-slate-600 font-medium text-lg">{currentTestimonial.initial}</span>
              </div>
            </div>
            
            <blockquote className="text-lg text-foreground mb-4">
              "{currentTestimonial.quote}"
            </blockquote>
            
            <p className="text-muted-foreground">
              — {currentTestimonial.name}, Neighbor
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;