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

// Real resource data from Good Samaritan 2025
const realResources: Resource[] = [
  {
    id: "1",
    name: "Cobb Family Resources",
    category: "Housing",
    description: "Rent/mortgage assistance up to $700, utilities assistance up to $500 (once-in-a-lifetime)",
    phone: "(770) 428-2601",
    eligibility: "Qualified families, once-in-a-lifetime assistance"
  },
  {
    id: "2",
    name: "Sweetwater Mission (CAMP)",
    category: "Housing",
    description: "Food and rental assistance for Cobb County residents in Mableton, Austell, Clarkdale, Lithia Springs, and Powder Springs",
    phone: "(770) 819-0662",
    url: "https://www.sweetwatermission.org",
    eligibility: "Cobb County residents only"
  },
  {
    id: "3",
    name: "Zion Baptist Church",
    category: "Housing",
    description: "Rent and mortgage assistance",
    phone: "(770) 427-8749",
    eligibility: "Contact for requirements"
  },
  {
    id: "4",
    name: "GMEN & Cobb County Housing",
    category: "Utilities",
    description: "Utilities, rent, and mortgage assistance",
    phone: "(678) 515-3346",
    url: "https://gmen.org/cobb-county",
    eligibility: "Contact for requirements"
  },
  {
    id: "5",
    name: "Store House Ministries",
    category: "General",
    description: "Utilities, mortgage assistance, counseling, food, shelter (no rent assistance)",
    phone: "(770) 428-8410",
    url: "https://crossviewmarietta.org/storehouse-ministries/",
    eligibility: "Contact for requirements"
  },
  {
    id: "6",
    name: "Tallatoona Community Action Partnership",
    category: "Utilities",
    description: "Utilities, food, and counseling services",
    phone: "(770) 817-4666",
    url: "https://www.tallatoonacap.org",
    eligibility: "Contact for requirements"
  },
  {
    id: "7",
    name: "United Way of Greater Atlanta",
    category: "General",
    description: "Utilities, rent, mortgage assistance, food, shelter, counseling",
    phone: "(404) 527-7200",
    url: "https://unitedway.org/local/united-states/georgia/united-way-of-greater-atlanta",
    eligibility: "Contact for requirements"
  },
  {
    id: "8",
    name: "The Haven of Help",
    category: "Emergency",
    description: "Homeless shelter services",
    phone: "(678) 469-8442",
    url: "https://www.thehavenofhelp.org",
    eligibility: "Homeless individuals and families"
  },
  {
    id: "9",
    name: "Bullock Hope House",
    category: "Emergency",
    description: "Homeless shelter and transitional housing",
    phone: "(470) 231-1300",
    url: "https://www.bullockhopehouse.org",
    eligibility: "Homeless individuals and families"
  },
  {
    id: "10",
    name: "MUST Ministries",
    category: "Emergency",
    description: "Homeless shelter, rental assistance, rapid rehousing, hotel vouchers",
    phone: "(470) 713-5017",
    url: "https://www.mustministries.org",
    eligibility: "Contact for current availability"
  },
  {
    id: "11",
    name: "Peaces of Kindness Inc.",
    category: "Food",
    description: "Food distribution every Wednesday 10am-3pm",
    phone: "(404) 312-8757",
    url: "https://www.peacesofkindness.org",
    eligibility: "Open to community"
  },
  {
    id: "12",
    name: "The Pantry",
    category: "Food",
    description: "Food assistance and pantry services",
    phone: "(770) 217-0729",
    url: "https://www.thepantrydc.com",
    eligibility: "Contact for requirements"
  },
  {
    id: "13",
    name: "Wellstar Mobile Market",
    category: "Food",
    description: "Mobile food market at First Presbyterian Church of Douglasville",
    url: "https://www.wellstarmobilemarket.com/#register",
    eligibility: "Must register first"
  },
  {
    id: "14",
    name: "St Vincent de Paul",
    category: "Utilities",
    description: "Utilities and food assistance only",
    phone: "(770) 941-2807",
    eligibility: "Contact for requirements"
  },
  {
    id: "15",
    name: "Hope Atlanta",
    category: "General",
    description: "Help for veterans, families, people with HIV/AIDS, mental health, seniors, rental assistance",
    phone: "(404) 817-7070",
    url: "https://hopeatlanta.org/get-help/",
    eligibility: "Must meet specific criteria"
  },
  {
    id: "16",
    name: "Georgia Power Payment Assistance",
    category: "Utilities",
    description: "Low Income Home Energy Assistance Program (LIHEAP)",
    url: "https://www.georgiapower.com/residential/billing-and-rate-plans/billing-options/payment-assistance.html",
    eligibility: "Income-based qualification"
  },
  {
    id: "17",
    name: "Cobb County Resource Finder",
    category: "General",
    description: "Search for local resources by zip code",
    url: "https://findhelp.cobbcounty.gov/",
    eligibility: "Enter zip code to search"
  }
];

const categories = ["All", "Housing", "Food", "Emergency", "Utilities", "General"];

const ResourcesSidebar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredResources = realResources.filter(resource => {
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