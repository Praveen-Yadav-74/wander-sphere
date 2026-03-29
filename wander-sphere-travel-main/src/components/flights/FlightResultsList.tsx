import { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronDown, Plane, SlidersHorizontal } from 'lucide-react';
import type { FlightModel } from '@/types/flight';
import { FlightCard } from './FlightCard';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface Props {
  flights: FlightModel[];
  onSelect: (flight: FlightModel) => void;
  isReviewing: boolean;
  totalPax: number;
}

type SortKey = 'price' | 'duration' | 'departure';

const PAGE_SIZE = 10;

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:w-44">
          <div className="w-10 h-10 rounded-xl bg-[#E2E8F0]" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-[#E2E8F0] rounded" />
            <div className="h-2.5 w-16 bg-[#F1F5F9] rounded" />
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4">
          <div className="text-center space-y-1.5">
            <div className="h-6 w-14 bg-[#E2E8F0] rounded" />
            <div className="h-2.5 w-8 bg-[#F1F5F9] rounded mx-auto" />
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="h-2 w-12 bg-[#F1F5F9] rounded" />
            <div className="w-full h-px bg-[#E2E8F0]" />
            <div className="h-2 w-14 bg-[#F1F5F9] rounded" />
          </div>
          <div className="text-center space-y-1.5">
            <div className="h-6 w-14 bg-[#E2E8F0] rounded" />
            <div className="h-2.5 w-8 bg-[#F1F5F9] rounded mx-auto" />
          </div>
        </div>
        <div className="sm:w-40 space-y-2">
          <div className="h-6 w-24 bg-[#E2E8F0] rounded ml-auto" />
          <div className="h-10 w-full bg-[#E0F2FE] rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}

export function FlightResultsList({ flights, onSelect, isReviewing }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('price');
  const [stopsFilter, setStopsFilter] = useState<'all' | '0' | '1'>('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const groupedSorted = useMemo(() => {
    let list = [...flights];

    if (stopsFilter !== 'all') {
      const stops = parseInt(stopsFilter);
      // Segments is now a flat array: stops = segs.length - 1
      list = list.filter((f) => (f.Segments as any[]).length - 1 === stops);
    }

    const groupMap = new Map<string, FlightModel[]>();
    const orderedKeys: string[] = [];

    for (const f of list) {
      const segs = f.Segments as any[];
      const key = segs.map((s: any) => `${s.AirlineCode}${s.FlightNumber}-${s.DepartureDateTime}`).join('|');
      if (!groupMap.has(key)) { groupMap.set(key, []); orderedKeys.push(key); }
      groupMap.get(key)!.push(f);
    }

    const groupedList = orderedKeys.map((key) => groupMap.get(key)!);

    groupedList.sort((a, b) => {
      // Price: use TotalFare (convenience alias) or TotalAmount
      const getPrice = (f: FlightModel) => (f as any).Fare?.TotalFare || (f as any).Fares?.[0]?.FareDetails?.[0]?.TotalAmount || 0;
      const minA = Math.min(...a.map(getPrice));
      const minB = Math.min(...b.map(getPrice));
      if (sortBy === 'price') return minA - minB;
      if (sortBy === 'departure') {
        const ta = (a[0].Segments as any[])[0]?.DepartureDateTime ?? '';
        const tb = (b[0].Segments as any[])[0]?.DepartureDateTime ?? '';
        return ta.localeCompare(tb);
      }
      return 0;
    });

    groupedList.forEach((g) => g.sort((a, b) => {
      const getP = (f: FlightModel) => (f as any).Fare?.TotalFare || (f as any).Fares?.[0]?.FareDetails?.[0]?.TotalAmount || 0;
      return getP(a) - getP(b);
    }));

    return groupedList;
  }, [flights, sortBy, stopsFilter]);


  useMemo(() => setPage(1), [sortBy, stopsFilter]);

  const visible = groupedSorted.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < groupedSorted.length;

  if (flights.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="w-16 h-16 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center mx-auto mb-4">
          <Plane className="w-7 h-7 text-[#0EA5E9]" />
        </div>
        <h3 className="text-[#0F172A] font-bold text-xl mb-1">No flights found</h3>
        <p className="text-[#64748B] text-sm font-medium">Try adjusting your dates or search route.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Sort / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#E2E8F0] px-4 py-3 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="text-[#64748B] font-medium text-sm flex items-center gap-1.5">
          <span className="text-[#0EA5E9] font-bold text-base">{groupedSorted.length}</span> flights found
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Stops filter */}
          <Select value={stopsFilter} onValueChange={(v) => setStopsFilter(v as typeof stopsFilter)}>
            <SelectTrigger className="w-full sm:w-36 bg-white border-[#E2E8F0] text-[#0F172A] font-medium text-sm h-10 rounded-[10px] hover:border-[#0EA5E9] focus:ring-0 transition-all">
              <SelectValue placeholder="All Stops" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E2E8F0] rounded-xl shadow-xl">
              <SelectItem value="all" className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">All Stops</SelectItem>
              <SelectItem value="0" className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">Non-Stop</SelectItem>
              <SelectItem value="1" className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">1+ Stops</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-44 bg-white border-[#E2E8F0] text-[#0F172A] font-medium text-sm h-10 rounded-[10px] hover:border-[#0EA5E9] focus:ring-0 transition-all">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#0EA5E9]" />
                <SelectValue placeholder="Sort By" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E2E8F0] rounded-xl shadow-xl">
              <SelectItem value="price" className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">Cheapest First</SelectItem>
              <SelectItem value="departure" className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">Earliest Departure</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Flights */}
      <div className="flex flex-col gap-3">
        {visible.map((group) => (
          <FlightCard key={group[0].ResultIndex} flightGroup={group} onSelect={onSelect} isReviewing={isReviewing} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            className="h-11 px-8 rounded-[10px] border-[#E2E8F0] bg-white text-[#0EA5E9] font-semibold text-sm hover:bg-[#F0F9FF] hover:border-[#0EA5E9] transition-all inline-flex items-center gap-2"
          >
            Load More Flights <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Loading skeletons (shown externally by parent when searching) */}
    </div>
  );
}
