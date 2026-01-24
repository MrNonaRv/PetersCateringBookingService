import { useQuery } from "@tanstack/react-query";
import { RecentEvent } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Star } from "lucide-react";

export function RecentEvents() {
  const { data: events, isLoading } = useQuery<RecentEvent[]>({
    queryKey: ["/api/recent-events"],
  });

  if (isLoading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Recent Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Recent Events</h2>
          <p className="text-gray-600">No recent events to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Recent Events</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Take a look at some of our recent catering successes. From intimate gatherings to grand celebrations, 
            we bring exceptional service to every event.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                {event.featured && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    {event.eventType}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-3">{event.title}</h3>

                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  {(() => {
                    const [y, m, d] = event.eventDate.split("-").map((v: string) => parseInt(v, 10));
                    return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString();
                  })()}
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.venue}
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <Users className="w-4 h-4 mr-2" />
                  {event.guestCount} guests
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {event.description}
                </p>

                {event.highlights && event.highlights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-800">Event Highlights:</h4>
                    <div className="flex flex-wrap gap-1">
                      {event.highlights.slice(0, 3).map((highlight, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {highlight}
                        </Badge>
                      ))}
                      {event.highlights.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.highlights.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
