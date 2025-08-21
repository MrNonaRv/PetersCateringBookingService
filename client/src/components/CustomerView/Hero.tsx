import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface HeroProps {
  onBookNow: () => void;
}

const heroSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
    title: "Exceptional Catering for Your Special Events",
    subtitle: "Professional service with delicious cuisine for weddings, corporate events, and private parties",
    buttonText: "Book Your Event",
    overlay: "bg-[#343a40] bg-opacity-50"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
    title: "Dream Weddings Made Perfect",
    subtitle: "From intimate gatherings to grand celebrations, we create unforgettable wedding experiences with exquisite Filipino cuisine",
    buttonText: "Plan Your Wedding",
    overlay: "bg-rose-900 bg-opacity-40"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
    title: "Corporate Events Excellence",
    subtitle: "Impress your clients and colleagues with professional catering that elevates your business gatherings",
    buttonText: "Corporate Catering",
    overlay: "bg-blue-900 bg-opacity-45"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
    title: "Celebrate Life's Milestones",
    subtitle: "Birthday parties, anniversaries, and special occasions deserve exceptional food and memorable experiences",
    buttonText: "Celebrate With Us",
    overlay: "bg-purple-900 bg-opacity-40"
  }
];

export default function Hero({ onBookNow }: HeroProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="relative h-[600px] overflow-hidden">
      <Carousel
        className="w-full h-full"
        setApi={setApi}
        opts={{
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 6000,
            stopOnInteraction: false,
          }),
        ]}
      >
        <CarouselContent>
          {heroSlides.map((slide, index) => (
            <CarouselItem key={slide.id} className="relative h-[600px]">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                style={{ 
                  backgroundImage: `url('${slide.image}')`,
                  backgroundPosition: 'center center'
                }}
              >
                <div className={`absolute inset-0 ${slide.overlay} transition-opacity duration-500`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 animate-fade-in-up">
                      {slide.title}
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
                      {slide.subtitle}
                    </p>
                    <Button
                      onClick={onBookNow}
                      className="bg-secondary hover:bg-secondary/90 hover:scale-110 text-white font-accent px-8 py-4 rounded-full text-lg md:text-xl shadow-2xl transition-all duration-300 transform animate-fade-in-up animation-delay-400"
                    >
                      {slide.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation arrows with enhanced styling */}
        <CarouselPrevious className="left-8 h-12 w-12 bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 text-white hover:text-white backdrop-blur-sm transition-all duration-300" />
        <CarouselNext className="right-8 h-12 w-12 bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 text-white hover:text-white backdrop-blur-sm transition-all duration-300" />
      </Carousel>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === current
                  ? 'bg-white scale-125 shadow-lg'
                  : 'bg-white/40 hover:bg-white/60 hover:scale-110'
              }`}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
        <div 
          className="h-full bg-secondary transition-all duration-1000 ease-out"
          style={{ 
            width: `${((current + 1) / heroSlides.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}
