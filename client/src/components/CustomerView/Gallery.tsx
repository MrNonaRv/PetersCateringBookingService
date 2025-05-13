export default function Gallery() {
  // Array of gallery images
  const galleryImages = [
    {
      src: "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Elegant plated dinner"
    },
    {
      src: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Dessert selection"
    },
    {
      src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Outdoor wedding reception"
    },
    {
      src: "https://images.unsplash.com/photo-1621111848501-8d3634f82336?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Corporate luncheon buffet"
    },
    {
      src: "https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Appetizer selection"
    },
    {
      src: "https://images.unsplash.com/photo-1529566652340-2c41a1eb6d93?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Formal table setting"
    }
  ];

  return (
    <section id="gallery" className="py-16 container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-2">Our Food Gallery</h2>
        <p className="text-[#343a40] max-w-2xl mx-auto">Take a look at some of our most popular dishes and event setups</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleryImages.map((image, index) => (
          <img 
            key={index}
            src={image.src} 
            alt={image.alt} 
            className="rounded-lg shadow-md hover:shadow-xl transition transform hover:scale-105"
          />
        ))}
      </div>
    </section>
  );
}
