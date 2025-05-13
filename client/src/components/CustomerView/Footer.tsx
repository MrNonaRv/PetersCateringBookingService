export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Peter's Creation</h3>
            <p className="mb-4">Professional catering services for all your special events. We make every occasion memorable with delicious food and exceptional service.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-secondary transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-white hover:text-secondary transition">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-white hover:text-secondary transition">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-white hover:text-secondary transition">
                <i className="fab fa-pinterest"></i>
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#services" className="hover:text-secondary transition">Services</a></li>
              <li><a href="#about" className="hover:text-secondary transition">About Us</a></li>
              <li><a href="#gallery" className="hover:text-secondary transition">Gallery</a></li>
              <li><a href="#contact" className="hover:text-secondary transition">Contact</a></li>
              <li><a href="#" className="hover:text-secondary transition">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-secondary transition">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3"></i>
                <span>123 Culinary Lane, Gourmet City, GC 12345</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-phone-alt mt-1 mr-3"></i>
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-envelope mt-1 mr-3"></i>
                <span>info@peterscreation.com</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-clock mt-1 mr-3"></i>
                <span>Mon-Fri: 9am-5pm, Sat: 10am-3pm</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white border-opacity-20 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} Peter's Creation Catering Services. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
