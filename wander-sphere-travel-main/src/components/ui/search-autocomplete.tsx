import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface SearchAutocompleteProps {
  items: string[];
  placeholder?: string;
  value: string;
  onSelect: (value: string) => void;
  className?: string;
  icon?: React.ReactNode;
}

export function SearchAutocomplete({
  items,
  placeholder = "Search...",
  value,
  onSelect,
  className,
  icon
}: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative w-full", className)}>
          {icon && (
             <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
               {icon}
             </div>
          )}
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-start font-normal text-left truncate flex h-10 rounded-md border border-input bg-transparent text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className,
              icon ? "pl-10" : "pl-3"
            )}
            onClick={() => setOpen(!open)}
          >
            {value ? value : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item}
                  value={item}
                  onSelect={(currentValue) => {
                    onSelect(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Simple Input with autocomplete list style (alternative)
export function SimpleAutocomplete({
  suggestions,
  value,
  onChange,
  placeholder,
  className,
  icon
}: {
  suggestions: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const filteredSuggestions = suggestions.filter(item => 
    item.toLowerCase().includes(value.toLowerCase()) && item !== value
  );

  return (
    <div className={cn("relative w-full", className)}>
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
          {icon}
        </div>
      )}
      <Input
        value={value}
        onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
        placeholder={placeholder}
        className={icon ? "pl-10" : ""}
      />
      
      {showSuggestions && value && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filteredSuggestions.map((item, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
              onClick={() => {
                onChange(item);
                setShowSuggestions(false);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
