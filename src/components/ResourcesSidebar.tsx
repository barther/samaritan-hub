import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, ExternalLink, Users } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  phone?: string;
  url?: string;
  eligibility?: string;
}

// Mock data - will be replaced with database data when Supabase is connected
const mockResources: Resource[] = [
  {
    id: "1",
    name: "Douglas County DFCS",
    category: "Government",
    description: "SNAP/TANF assistance and family services",
    phone: "(770) 489-3010",
    url: "https://dfcs.georgia.gov/",
    eligibility: "Income-based qualification required"
  },
  {
    id: "2",
    name: "Local Food Pantry",
    category: "Food",
    description: "Weekly groceries and emergency food assistance",
    phone: "(770) 555-1212",
    url: "https://example.org/food",
    eligibility: "Open to county residents"
  },
  {
    id: "3",
    name: "Salvation Army",
    category: "Emergency",
    description: "Emergency shelter and utility assistance",
    phone: "(770) 555-3434",
    eligibility: "Emergency situations only"
  },
  {
    id: "4",
    name: "Georgia Power LIHEAP",
    category: "Utilities",
    description: "Low Income Home Energy Assistance Program",
    phone: "1-800-433-7343",
    url: "https://www.georgiapower.com/residential/billing-and-rate-plans/financial-assistance",
    eligibility: "Income at or below 60% of state median"
  },
  {
    id: "5",
    name: "United Way of Metro Atlanta",
    category: "General",
    description: "Connect to local resources and services",
    phone: "2-1-1",
    url: "https://unitedwayatlanta.org/",
    eligibility: "Open to all residents"
  }
];

const categories = ["All", "Government", "Food", "Emergency", "Utilities", "General"];

const ResourcesSidebar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full lg:w-80 space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Local Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Resources List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredResources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No resources found matching your criteria.
              </p>
            ) : (
              filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="border border-border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-foreground text-sm">{resource.name}</h4>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {resource.category}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {resource.description}
                  </p>
                  
                  {resource.eligibility && (
                    <p className="text-xs text-accent font-medium">
                      Eligibility: {resource.eligibility}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 pt-1">
                    {resource.phone && (
                      <a
                        href={`tel:${resource.phone}`}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        {resource.phone}
                      </a>
                    )}
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Note */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Need help finding resources?</strong> Our staff can assist you in connecting 
              with the most appropriate services for your situation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourcesSidebar;