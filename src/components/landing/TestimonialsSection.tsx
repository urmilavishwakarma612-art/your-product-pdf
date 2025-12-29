import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Linkedin, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id: string;
  name: string;
  avatar_url: string | null;
  linkedin_url: string | null;
  review: string;
  role: string | null;
  company: string | null;
  company_logo_url: string | null;
}

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 180;
  const isLongReview = testimonial.review.length > maxLength;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {testimonial.avatar_url ? (
            <img
              src={testimonial.avatar_url}
              alt={testimonial.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {testimonial.name.charAt(0)}
            </div>
          )}
          <div>
            <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
            {(testimonial.role || testimonial.company) && (
              <p className="text-sm text-muted-foreground">
                {testimonial.role}{testimonial.role && testimonial.company && " at "}{testimonial.company}
              </p>
            )}
          </div>
        </div>
        {testimonial.linkedin_url && (
          <a
            href={testimonial.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <Linkedin className="w-5 h-5 text-blue-500" />
          </a>
        )}
      </div>

      {/* Review */}
      <div className="flex-1 mb-4">
        <Quote className="w-6 h-6 text-primary/30 mb-2" />
        <p className="text-muted-foreground leading-relaxed">
          {isExpanded || !isLongReview
            ? testimonial.review
            : `${testimonial.review.substring(0, maxLength)}...`}
        </p>
        {isLongReview && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary text-sm mt-2 hover:underline"
          >
            {isExpanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>

      {/* Company Logo */}
      {testimonial.company_logo_url && (
        <div className="pt-4 border-t border-border/50">
          <img
            src={testimonial.company_logo_url}
            alt={testimonial.company || "Company"}
            className="h-6 object-contain opacity-60"
          />
        </div>
      )}
    </motion.div>
  );
};

export const TestimonialsSection = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    slidesToScroll: 1,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (isLoading) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="h-10 bg-muted/30 rounded w-64 mx-auto animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="hero-orb-2 -right-40 top-1/2 -translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Our <span className="gradient-text">Learners</span> Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Join thousands of developers who have transformed their problem-solving skills
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 min-w-0"
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="rounded-full w-12 h-12 border-border/50 hover:border-primary/50 hover:bg-primary/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="rounded-full w-12 h-12 border-border/50 hover:border-primary/50 hover:bg-primary/10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
