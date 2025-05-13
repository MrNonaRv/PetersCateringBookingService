import { Button } from "@/components/ui/button";

interface HeroProps {
  onBookNow: () => void;
}

export default function Hero({ onBookNow }: HeroProps) {
  return (
    <div className="relative h-[500px] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1565538810643-b5bdb714032a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')" }}>
      <div className="absolute inset-0 bg-[#343a40] bg-opacity-50"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Exceptional Catering for Your Special Events</h1>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">Professional service with delicious cuisine for weddings, corporate events, and private parties</p>
          <Button
            onClick={onBookNow}
            className="bg-secondary hover:bg-opacity-90 text-white font-accent px-6 py-3 rounded-md text-lg"
          >
            Book Your Event
          </Button>
        </div>
      </div>
    </div>
  );
}
