import { Card, CardContent } from "@/components/ui/card";

export default function Testimonials() {
  // Array of testimonials
  const testimonials = [
    {
      text: "Peter's Creation Catering made our wedding day perfect. The food was exceptional, and the service was impeccable. All our guests were impressed!",
      author: "Sarah & Michael",
      event: "Wedding Reception",
      rating: 5
    },
    {
      text: "We've used Peter's Creation for multiple corporate events, and they never disappoint. Professional, reliable, and the food is always outstanding.",
      author: "David Reynolds",
      event: "Corporate Event Manager",
      rating: 5
    },
    {
      text: "The birthday party catering exceeded our expectations. The staff was friendly, the presentation was beautiful, and everyone loved the food!",
      author: "Jennifer Lopez",
      event: "Private Birthday Party",
      rating: 4.5
    }
  ];

  // Function to render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star"></i>);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
    }
    
    return stars;
  };

  return (
    <section className="py-16 bg-[#f8f9fa]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-primary mb-2">What Our Clients Say</h2>
          <p className="text-[#343a40] max-w-2xl mx-auto">Hear from some of our satisfied customers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white p-8 rounded-lg shadow-md">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="text-secondary">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
                <p className="text-[#343a40] italic mb-4">"{testimonial.text}"</p>
                <div className="font-accent">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-[#343a40]">{testimonial.event}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
