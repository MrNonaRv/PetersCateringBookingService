import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  onBookNow: () => void;
}

export default function Navigation({ onBookNow }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-heading font-bold text-primary">Peter's Creation</h1>
            <span className="ml-2 text-secondary font-accent">Catering Services</span>
          </div>
          <div className="hidden md:flex space-x-6 font-accent text-[#343a40]">
            <a href="#services" className="hover:text-secondary transition">Services</a>
            <a href="#about" className="hover:text-secondary transition">About</a>
            <a href="#gallery" className="hover:text-secondary transition">Gallery</a>
            <a href="#contact" className="hover:text-secondary transition">Contact</a>
          </div>
          <div>
            <Button 
              onClick={onBookNow} 
              className="bg-secondary hover:bg-opacity-90 text-white font-accent"
            >
              Book Now
            </Button>
          </div>
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="text-[#343a40]">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-inner">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col space-y-3 font-accent">
              <a 
                href="#services" 
                className="hover:text-secondary transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </a>
              <a 
                href="#about" 
                className="hover:text-secondary transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#gallery" 
                className="hover:text-secondary transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Gallery
              </a>
              <a 
                href="#contact" 
                className="hover:text-secondary transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
