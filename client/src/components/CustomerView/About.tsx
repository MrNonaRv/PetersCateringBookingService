export default function About() {
  return (
    <section id="about" className="py-16 bg-primary bg-opacity-5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <img 
              src="https://pixabay.com/get/ge015d2a743e5580263d78ae78c25aa6d86f73010b7c9f34420cc3e07426043dce1c0384103ed008d7e9cace3d7fd69790a373db0424a1699a53745ee2bbacfa7_1280.jpg" 
              alt="About Peter's Creation Catering" 
              className="rounded-lg shadow-xl"
            />
          </div>
          <div className="md:w-1/2 md:pl-12">
            <h2 className="text-3xl font-heading font-bold text-primary mb-4">About Peter's Creation Catering</h2>
            <p className="text-[#343a40] mb-4">
              For over 15 years, Peter's Creation Catering has been serving delicious cuisine and providing exceptional service to our clients. 
              Our dedicated team of chefs and staff are committed to making your event memorable.
            </p>
            <p className="text-[#343a40] mb-6">
              We source the finest ingredients, prepare everything fresh, and customize our menus to meet your specific needs and preferences.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <i className="fas fa-utensils text-secondary mr-2"></i>
                <span>Custom Menus</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-leaf text-secondary mr-2"></i>
                <span>Fresh Ingredients</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-medal text-secondary mr-2"></i>
                <span>Award-Winning</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-user-tie text-secondary mr-2"></i>
                <span>Professional Staff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
