/**
 * FlightSearchForm – Clean Premium Light Theme (Skyscanner/Cleartrip style)
 */

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import {
  Plane, ArrowLeftRight, Calendar, Users, ChevronDown,
  Search, Plus, Trash2, Zap, ShieldCheck, HeadphonesIcon, Tag,
} from 'lucide-react';
import { searchSchema, type SearchFormValues } from '@/lib/schemas/flightSchemas';
import type { JourneyType } from '@/types/flight';
import { AirportSelect } from './AirportSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  onSearch: (values: SearchFormValues) => void;
  isLoading: boolean;
}

const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

const JOURNEY_LABELS: Record<string, string> = {
  OneWay: 'One Way',
  RoundTrip: 'Round Trip',
  SpecialRoundTrip: 'Special Return',
  MultiCity: 'Multi City',
};

const TRUST_ITEMS = [
  { icon: Tag, label: 'Lowest Fares', sub: 'Best price guaranteed' },
  { icon: Zap, label: 'Instant Confirmation', sub: 'Tickets issued in seconds' },
  { icon: ShieldCheck, label: 'Secure Booking', sub: '256-bit SSL encrypted' },
  { icon: HeadphonesIcon, label: '24/7 Support', sub: 'Always here to help' },
];

export function FlightSearchForm({ onSearch, isLoading }: Props) {
  const [journeyType, setJourneyType] = useState<JourneyType>('OneWay');

  const {
    register, handleSubmit, control, setValue, watch,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      Origin: '',
      Destination: '',
      DepartureDate: tomorrow,
      Adults: 1,
      Children: 0,
      Infants: 0,
      CabinClass: 'Economy',
      JourneyType: 'OneWay',
      DirectFlight: false,
      MultiCityLegs: [
        { Origin: '', Destination: '', DepartureDate: tomorrow },
        { Origin: '', Destination: '', DepartureDate: tomorrow },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'MultiCityLegs' });

  const adults = watch('Adults');
  const children = watch('Children');
  const infants = watch('Infants');

  const swapAirports = useCallback(() => {
    const o = watch('Origin'), d = watch('Destination');
    setValue('Origin', d);
    setValue('Destination', o);
  }, [watch, setValue]);

  // Shared input styles
  const inputCls =
    'h-12 bg-white border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 rounded-[10px] transition-all duration-200 font-medium text-sm uppercase tracking-wide';
  const labelCls = 'text-[#64748B] text-[11px] font-semibold uppercase tracking-wider mb-1.5 block';

  return (
    <div className="w-full">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#0EA5E9] via-[#0284C7] to-[#0369A1] pt-12 pb-32 px-4 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h1 className="text-[28px] sm:text-[40px] font-bold text-white leading-tight mb-2">
            Search cheap flights
          </h1>
          <p className="text-white/70 text-sm sm:text-base font-medium">
            Compare fares across hundreds of airlines instantly
          </p>
        </div>
      </div>

      {/* ── FLOATING SEARCH CARD ──────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-[#E2E8F0] p-5 sm:p-7">
          {/* Journey Tabs */}
          <div className="flex gap-2 flex-wrap mb-6 border-b border-[#F1F5F9] pb-4">
            {(['OneWay', 'RoundTrip', 'SpecialRoundTrip', 'MultiCity'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setJourneyType(type); setValue('JourneyType', type); }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 uppercase tracking-wider whitespace-nowrap border ${
                  journeyType === type
                    ? 'bg-[#0EA5E9] text-white border-[#0EA5E9] shadow-sm'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#0EA5E9] hover:text-[#0EA5E9]'
                }`}
              >
                {JOURNEY_LABELS[type]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
            {/* Multi-city legs */}
            {journeyType === 'MultiCity' ? (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div>
                      <AirportSelect
                        label="From"
                        placeholder="City code (DEL)"
                        icon="takeoff"
                        value={watch(`MultiCityLegs.${index}.Origin`)}
                        onChange={(val) => {
                          setValue(`MultiCityLegs.${index}.Origin`, val, { shouldValidate: true });
                        }}
                      />
                    </div>
                    <div>
                      <AirportSelect
                        label="To"
                        placeholder="City code (BOM)"
                        icon="landing"
                        value={watch(`MultiCityLegs.${index}.Destination`)}
                        onChange={(val) => {
                          setValue(`MultiCityLegs.${index}.Destination`, val, { shouldValidate: true });
                        }}
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className={labelCls}>Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0EA5E9]" />
                          <Input {...register(`MultiCityLegs.${index}.DepartureDate` as const)} type="date" min={tomorrow} className={`${inputCls} pl-10 cursor-pointer`} />
                        </div>
                      </div>
                      {fields.length > 2 && (
                        <button type="button" onClick={() => remove(index)} className="h-12 w-12 rounded-[10px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all self-end">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {fields.length < 5 && (
                  <button type="button" onClick={() => append({ Origin: '', Destination: '', DepartureDate: tomorrow })} className="flex items-center gap-2 text-[#0EA5E9] text-sm font-semibold hover:text-[#0284C7] transition-colors">
                    <Plus className="h-4 w-4" /> Add Another Flight
                  </button>
                )}
              </div>
            ) : (
              /* Standard route row */
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                <div>
                  <AirportSelect
                    label="From"
                    placeholder="Departure city (DEL)"
                    icon="takeoff"
                    value={watch('Origin') || ''}
                    onChange={(val) => {
                      setValue('Origin', val, { shouldValidate: true });
                    }}
                    error={errors.Origin?.message}
                  />
                </div>

                <button type="button" onClick={swapAirports} className="h-12 w-12 rounded-full border-2 border-[#E2E8F0] bg-white text-[#0EA5E9] hover:border-[#0EA5E9] hover:bg-[#E0F2FE] flex items-center justify-center transition-all duration-200 self-end hover:scale-110 active:scale-95">
                  <ArrowLeftRight className="h-4 w-4" />
                </button>

                <div>
                  <AirportSelect
                    label="To"
                    placeholder="Arrival city (BOM)"
                    icon="landing"
                    value={watch('Destination') || ''}
                    onChange={(val) => {
                      setValue('Destination', val, { shouldValidate: true });
                    }}
                    error={errors.Destination?.message}
                  />
                </div>
              </div>
            )}

            {/* Dates, Class, Pax row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {journeyType !== 'MultiCity' && (
                <div>
                  <Label className={labelCls}>Departure Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0EA5E9]" />
                    <Input {...register('DepartureDate')} type="date" min={tomorrow} className={`${inputCls} pl-10 cursor-pointer`} />
                  </div>
                </div>
              )}

              {(journeyType === 'RoundTrip' || journeyType === 'SpecialRoundTrip') ? (
                <div>
                  <Label className={labelCls}>Return Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0EA5E9]" />
                    <Input {...register('ReturnDate')} type="date" min={watch('DepartureDate') || tomorrow} className={`${inputCls} pl-10 cursor-pointer`} />
                  </div>
                </div>
              ) : (
                <div>
                  <Label className={labelCls}>Cabin Class</Label>
                  <Controller
                    control={control}
                    name="CabinClass"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-12 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-[10px] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 text-sm font-medium transition-all">
                          <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E2E8F0] rounded-xl shadow-xl">
                          {['Economy', 'PremiumEconomy', 'Business', 'First'].map((c) => (
                            <SelectItem key={c} value={c} className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium text-sm">
                              {c === 'PremiumEconomy' ? 'Premium Economy' : c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              <div>
                <Label className={labelCls}>Passengers</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="w-full flex items-center justify-between px-4 h-12 bg-white border border-[#E2E8F0] rounded-[10px] text-[#0F172A] text-sm font-medium hover:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#0EA5E9]" />
                        <span>{adults + children + infants} Passenger{adults + children + infants !== 1 ? 's' : ''}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-4">
                    {([ { label: 'Adults', key: 'Adults', sub: '12+ yrs', min: 1 }, { label: 'Children', key: 'Children', sub: '2–11 yrs', min: 0 }, { label: 'Infants', key: 'Infants', sub: 'Under 2', min: 0 } ] as const).map(({ label, key, sub, min }) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
                        <div>
                          <p className="font-semibold text-sm text-[#0F172A]">{label}</p>
                          <p className="text-[11px] text-[#94A3B8] font-medium">{sub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setValue(key, Math.max(min, watch(key) - 1))} className="w-8 h-8 rounded-full border-2 border-[#E2E8F0] hover:border-[#0EA5E9] hover:bg-[#E0F2FE] flex items-center justify-center text-[#0F172A] font-bold text-sm transition-all">−</button>
                          <span className="w-4 text-center font-bold text-sm text-[#0EA5E9]">{watch(key)}</span>
                          <button type="button" onClick={() => setValue(key, Math.min(9, watch(key) + 1))} className="w-8 h-8 rounded-full border-2 border-[#E2E8F0] hover:border-[#0EA5E9] hover:bg-[#E0F2FE] flex items-center justify-center text-[#0F172A] font-bold text-sm transition-all">+</button>
                        </div>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Footer row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#F1F5F9] mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" {...register('DirectFlight')} className="w-4 h-4 rounded border-[#CBD5E1] text-[#0EA5E9] focus:ring-[#0EA5E9]/30 cursor-pointer accent-[#0EA5E9]" />
                <span className="text-[#64748B] font-medium text-sm group-hover:text-[#0F172A] transition-colors">Non-stop flights only</span>
              </label>
              
              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 w-full sm:w-auto">
                {Object.keys(errors).length > 0 && (
                  <p className="text-red-500 text-xs font-semibold mr-2 animate-pulse">
                    Please fix the asterisk fields
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto min-w-[200px] h-12 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold rounded-[10px] shadow-md shadow-[#0EA5E9]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm gap-2 border-0"
                >
                  {isLoading ? <Spinner /> : <><Search className="h-4 w-4" /> Search Flights</>}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Trust Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[#0EA5E9]" />
              </div>
              <div>
                <p className="text-[#0F172A] font-semibold text-xs leading-tight">{label}</p>
                <p className="text-[#94A3B8] text-[10px] font-medium">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
