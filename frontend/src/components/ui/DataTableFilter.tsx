import React from "react";
import { Search, Filter } from "lucide-react";
import { Card } from "./Card";
import { Input } from "./Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface DataTableFilterProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterConfig[];
  className?: string;
}

export const DataTableFilter: React.FC<DataTableFilterProps> = ({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters = [],
  className = "",
}) => {
  return (
    <Card className={`${className} p-4`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          {filters.length > 0 && (
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex gap-2">
                {filters.map((filter) => (
                  <Select
                    key={filter.key}
                    value={filter.value}
                    onValueChange={filter.onChange}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
              </div>
            </div>
          )}
        </div>
    </Card>
  );
};

export default DataTableFilter;
