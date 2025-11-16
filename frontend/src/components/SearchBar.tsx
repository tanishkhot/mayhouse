'use client';

import { useState } from "react";
import { Search, Calendar, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SearchBar() {
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [guests, setGuests] = useState("");

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Search:", { destination, dates, guests });
  };

  return (
    <div className="w-full flex justify-center bg-white py-8">
      <Card className="w-full max-w-5xl rounded-full shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden bg-white">
        <CardContent className="flex items-center justify-between px-8 py-4 gap-0">
          {/* Where Section */}
          <div className="flex flex-col flex-1 border-r border-gray-100 pr-6 min-w-0 cursor-pointer group">
            <label className="text-[10px] font-semibold text-gray-900 mb-1.5 tracking-wide uppercase">
              Where
            </label>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
              <input
                type="text"
                placeholder="Search destinations"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent font-medium"
              />
            </div>
          </div>

          {/* When Section */}
          <div className="flex flex-col flex-1 border-r border-gray-100 pr-6 pl-6 min-w-0 cursor-pointer group">
            <label className="text-[10px] font-semibold text-gray-900 mb-1.5 tracking-wide uppercase">
              When
            </label>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
              <input
                type="text"
                placeholder="Add dates"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent font-medium"
              />
            </div>
          </div>

          {/* Who Section */}
          <div className="flex flex-col flex-1 pr-6 pl-6 min-w-0 cursor-pointer group">
            <label className="text-[10px] font-semibold text-gray-900 mb-1.5 tracking-wide uppercase">
              Who
            </label>
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
              <input
                type="text"
                placeholder="Add guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent font-medium"
              />
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch}
            className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white p-3.5 ml-4 flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

