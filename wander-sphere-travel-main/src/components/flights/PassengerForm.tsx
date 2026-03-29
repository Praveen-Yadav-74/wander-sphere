import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPassengerSchema, type PassengerFormValues } from '@/lib/schemas/flightSchemas';
import type { PassengerInput, SSRResponse, PaxType } from '@/types/flight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { User, Mail, Phone, Globe, Briefcase, Utensils, CheckCircle, ChevronDown, ChevronUp, Calendar, UserCheck } from 'lucide-react';
import { formatPrice } from '@/utils/etravDate';
import { useState } from 'react';

interface Props {
  paxIndex: number;
  paxType: PaxType;
  travelDate: string;
  ssrOptions: SSRResponse | null;
  onSubmit: (data: PassengerInput) => void;
  isLast: boolean;
}

export function PassengerForm({ paxIndex, paxType, travelDate, ssrOptions, onSubmit, isLast }: Props) {
  const schema = createPassengerSchema(travelDate, paxType);
  const [extrasOpen, setExtrasOpen] = useState(false);

  const {
    register, handleSubmit, control, watch,
    formState: { errors, isSubmitSuccessful },
  } = useForm<PassengerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      Title: paxType === 'Adult' ? 'Mr' : 'Mstr',
      Gender: 'Male',
    },
  });

  const paxLabel = paxType === 'Adult' ? 'Adult' : paxType === 'Child' ? 'Child' : 'Infant';

  const inputCls =
    'h-12 bg-white border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 rounded-[10px] transition-all duration-200 font-medium text-sm';
  const labelCls = 'text-[#64748B] text-[11px] font-semibold uppercase tracking-wider mb-1.5 block';
  const errCls = 'text-red-500 text-[11px] font-semibold mt-1';

  const sectionHead = 'flex items-center gap-2 text-[#0F172A] font-semibold text-sm mb-4 pb-3 border-b border-[#F1F5F9]';

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({ ...(data as PassengerInput), PaxType: paxType }))}
      className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0EA5E9] text-white font-bold text-sm flex items-center justify-center">
            {paxIndex + 1}
          </div>
          <div>
            <p className="text-[#0F172A] font-bold text-sm">Passenger {paxIndex + 1}</p>
            <p className="text-[#64748B] text-xs font-medium">Enter details exactly as on government ID</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitSuccessful && <CheckCircle className="w-5 h-5 text-[#10B981]" />}
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9] bg-[#E0F2FE] px-3 py-1.5 rounded-full border border-[#BAE6FD]">
            {paxLabel}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Personal Details */}
        <div>
          <div className={sectionHead}>
            <User className="w-4 h-4 text-[#0EA5E9]" />
            Personal Details
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className={labelCls}>Title</Label>
                <Controller
                  control={control}
                  name="Title"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className={`${inputCls} px-3`}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E2E8F0] rounded-xl shadow-xl">
                        {['Mr', 'Mrs', 'Ms', 'Mstr', 'Miss'].map((t) => (
                          <SelectItem key={t} value={t} className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="md:col-span-3">
                <Label className={labelCls}>Full Name (as on ID)</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input {...register('FullName')} placeholder="Enter full name" className={`${inputCls} pl-10`} />
                </div>
                {errors.FullName && <p className={errCls}>{errors.FullName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>Age</Label>
                <Input {...register('Age')} type="number" placeholder="Enter age" className={inputCls} />
                {errors.Age && <p className={errCls}>{errors.Age.message}</p>}
              </div>
              <div>
                <Label className={labelCls}>Gender</Label>
                <Controller
                  control={control}
                  name="Gender"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className={`${inputCls} px-3`}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border-[#E2E8F0] rounded-xl shadow-xl">
                        <SelectItem value="Male" className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">Male</SelectItem>
                        <SelectItem value="Female" className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Docs */}
        <div>
          <div className={sectionHead}>
            <Globe className="w-4 h-4 text-[#0EA5E9]" />
            Contact & Travel Documents
          </div>
          <div className="space-y-4">
            {paxIndex === 0 && paxType === 'Adult' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelCls}>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input {...register('Email')} type="email" placeholder="name@example.com" className={`${inputCls} pl-10`} />
                  </div>
                  {errors.Email && <p className={errCls}>{errors.Email.message}</p>}
                </div>
                <div>
                  <Label className={labelCls}>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input {...register('ContactNo')} placeholder="+91 XXXXX XXXXX" className={`${inputCls} pl-10`} />
                  </div>
                  {errors.ContactNo && <p className={errCls}>{errors.ContactNo.message}</p>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>Passport No. (Optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <Input {...register('PassportNo')} placeholder="Passport number" className={`${inputCls} pl-10 uppercase`} />
                </div>
              </div>
              <div>
                <Label className={labelCls}>Passport Expiry</Label>
                <Input {...register('PassportExpiry')} type="date" className={`${inputCls} cursor-pointer`} />
              </div>
            </div>
          </div>
        </div>

        {/* Flight Extras – collapsible */}
        {(ssrOptions?.MealDynamic?.length || ssrOptions?.BaggageDetails?.length) ? (
          <div>
            <button
              type="button"
              onClick={() => setExtrasOpen(!extrasOpen)}
              className="flex items-center justify-between w-full text-[#0EA5E9] font-semibold text-sm py-3 border-t border-[#F1F5F9] hover:text-[#0284C7] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                Flight Extras (Meal & Baggage)
              </div>
              {extrasOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {extrasOpen && (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ssrOptions?.MealDynamic && ssrOptions.MealDynamic.length > 0 && (
                    <div>
                      <Label className={labelCls}><Utensils className="w-3 h-3 inline mr-1" />Meal Preference</Label>
                      <Controller
                        control={control}
                        name="MealCode"
                        render={({ field }) => (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => field.onChange('')}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 border ${
                                !field.value
                                  ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                              }`}
                            >
                              No preference
                            </button>
                            {ssrOptions?.MealDynamic?.map((m) => {
                              // We use the Description as the chip label, or a shortened version
                              const label = m.Description;
                              const isSelected = field.value === m.Code;
                              return (
                                <button
                                  key={m.Code}
                                  type="button"
                                  onClick={() => field.onChange(m.Code)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 border ${
                                    isSelected
                                      ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                                  }`}
                                >
                                  {label} (+{formatPrice(m.Amount)})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      />
                    </div>
                  )}

                  {ssrOptions?.BaggageDetails && ssrOptions.BaggageDetails.length > 0 && (
                    <div>
                      <Label className={labelCls}><Briefcase className="w-3 h-3 inline mr-1" />Extra Baggage</Label>
                      <Controller
                        control={control}
                        name="BaggageCode"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue="">
                            <SelectTrigger className={`${inputCls} px-3`}><SelectValue placeholder="Standard allowance" /></SelectTrigger>
                            <SelectContent className="bg-white border-[#E2E8F0] rounded-xl shadow-xl max-h-60">
                              <SelectItem value="" className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg font-medium">Standard allowance</SelectItem>
                              {ssrOptions?.BaggageDetails?.map((b) => (
                                <SelectItem key={b.Code} value={b.Code} className="text-[#0F172A] focus:bg-[#E0F2FE] focus:text-[#0284C7] rounded-lg text-sm">
                                  {b.Description} (+{formatPrice(b.Amount)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F1F5F9]">
                  <Label className={labelCls}>Wheelchair Assistance (WCHR)</Label>
                  <p className="text-[#94A3B8] text-xs font-medium mb-3">Request special assistance at the airport</p>
                  <Controller
                    control={control}
                    name="Wheelchair"
                    render={({ field }) => (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                            field.value === true
                              ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                              : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                            field.value === false || field.value === undefined
                              ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                              : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-[#F1F5F9] pt-4">
            <Label className={labelCls}>Wheelchair Assistance (WCHR)</Label>
            <p className="text-[#94A3B8] text-xs font-medium mb-3">Request special assistance at the airport</p>
            <Controller
              control={control}
              name="Wheelchair"
              render={({ field }) => (
                <div className="flex gap-2 max-w-[200px]">
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                      field.value === true
                        ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                        : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                      field.value === false || field.value === undefined
                        ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                        : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    No
                  </button>
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="px-6 pb-6">
        <Button
          type="submit"
          className="w-full h-12 rounded-[10px] bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-[#0EA5E9]/25 border-0 flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {isLast ? 'Save & Continue to Seat Selection' : 'Save & Next Passenger'}
        </Button>
      </div>
    </form>
  );
}
