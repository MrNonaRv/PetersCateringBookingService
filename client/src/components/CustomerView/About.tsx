import { useQuery } from "@tanstack/react-query";

export default function About() {
  const { data: images = [] } = useQuery<any[]>({
    queryKey: ["/api/gallery-images", "about"],
    queryFn: async () => {
      const res = await fetch("/api/gallery-images?category=about");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const activeImage =
    (images || []).reverse().find((img: any) => Boolean(img.isActive)) ||
    (images || [])[0];

  const fallback =
    "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&h=720";

  return (
    <section id="about" className="py-16 bg-primary bg-opacity-5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <img 
              src={activeImage ? `/uploads/${activeImage.filename}` : fallback}
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
