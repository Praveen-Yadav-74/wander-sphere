/**
 * Zod Schemas – Flight Module
 * Validates all user inputs before they reach the API.
 */

import { z } from 'zod';
import { addMonths, isBefore, parseISO, differenceInYears, startOfDay } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────

const iataCode = z
  .string()
  .transform((v) => v.toUpperCase())
  .refine((v) => v === '' || /^[A-Z]{3}$/.test(v), 'Must be a 3-letter IATA code');

const futureDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((d) => !isBefore(startOfDay(parseISO(d)), startOfDay(new Date())), {
    message: 'Date must be today or in the future',
  });

// ── Search Schema ─────────────────────────────────────────────────────────────

export const searchSchema = z
  .object({
    Origin: iataCode.optional(),
    Destination: iataCode.optional(),
    DepartureDate: futureDate.optional(),
    ReturnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
      .optional()
      .or(z.literal('')),
    MultiCityLegs: z.array(z.object({
      Origin: iataCode,
      Destination: iataCode,
      DepartureDate: futureDate,
    })).min(2).max(5).optional(),
    Adults: z.number().int().min(1).max(9),
    Children: z.number().int().min(0).max(9),
    Infants: z.number().int().min(0).max(9),
    CabinClass: z.enum(['Economy', 'Business', 'First', 'PremiumEconomy']),
    JourneyType: z.enum(['OneWay', 'RoundTrip', 'SpecialRoundTrip', 'MultiCity']),
    DirectFlight: z.boolean().optional(),
  })
  .refine(
    (d) => d.JourneyType === 'MultiCity' || (d.Origin && d.Origin.length === 3),
    { message: 'Origin must be a 3-letter code', path: ['Origin'] }
  )
  .refine(
    (d) => d.JourneyType === 'MultiCity' || (d.Destination && d.Destination.length === 3),
    { message: 'Destination must be a 3-letter code', path: ['Destination'] }
  )
  .refine(
    (d) => d.JourneyType === 'MultiCity' || d.Origin !== d.Destination,
    { message: 'Origin and Destination cannot be the same', path: ['Destination'] }
  )
  .refine(
    (d) => {
      if (d.JourneyType === 'MultiCity') {
        return d.MultiCityLegs && d.MultiCityLegs.every(leg =>
          leg.Origin.length === 3 &&
          leg.Destination.length === 3 &&
          leg.Origin !== leg.Destination
        );
      }
      return true;
    },
    { message: 'All legs must have valid distinct origin and destination codes', path: ['MultiCityLegs'] }
  )
  .refine((d) => d.Infants <= d.Adults, {
    message: 'Number of infants cannot exceed number of adults',
    path: ['Infants'],
  })
  .refine((d) => d.Adults + d.Children + d.Infants <= 9, {
    message: 'Total passengers cannot exceed 9',
    path: ['Adults'],
  })
  .refine(
    (d) =>
      d.JourneyType === 'OneWay' ||
      d.JourneyType === 'MultiCity' ||
      (d.ReturnDate && d.DepartureDate && d.ReturnDate >= d.DepartureDate),
    {
      message: 'Return date must be after departure date',
      path: ['ReturnDate'],
    }
  );

export type SearchFormValues = z.infer<typeof searchSchema>;

// ── Passenger Schema ──────────────────────────────────────────────────────────

/**
 * Creates a passenger schema that validates age category against DOB
 * and passport expiry against the travel date.
 */
export function createPassengerSchema(travelDate: string, paxType: 'Adult' | 'Child' | 'Infant') {
  return z
    .object({
      Title: z.enum(['Mr', 'Mrs', 'Ms', 'Mstr', 'Miss']),
      FullName: z
        .string()
        .min(3, 'Full name must be at least 3 characters')
        .max(100)
        .regex(/^[A-Za-z\s-]+$/, 'Only letters, spaces, and hyphens allowed'),
      Age: z.coerce.number().int().min(0).max(120)
        .refine(
          (age) => {
            if (paxType === 'Infant') return age < 2;
            if (paxType === 'Child') return age >= 2 && age < 12;
            return age >= 12;
          },
          {
            message:
              paxType === 'Infant'
                ? 'Infant must be under 2 years'
                : paxType === 'Child'
                ? 'Child must be between 2 and 11 years'
                : 'Adult must be 12 years or older',
          }
        ),
      Gender: z.enum(['Male', 'Female']),
      PassportNo: z
        .string()
        .regex(/^[A-Z0-9]{6,9}$/, 'Invalid passport number format')
        .optional()
        .or(z.literal('')),
      PassportExpiry: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
        .optional()
        .or(z.literal('')),
      PassportIssuingCountry: z.string().optional(),
      Nationality: z.string().optional(),
      Email: z.string().email('Invalid email address'),
      ContactNo: z
        .string()
        .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
      AddressLine1: z.string().optional(),
      City: z.string().optional(),
      CountryCode: z.string().optional(),
      MealCode: z.string().optional(),
      BaggageCode: z.string().optional(),
      SeatCode: z.string().optional(),
      Wheelchair: z.boolean().optional(),
    })
    .refine(
      (p) => {
        if (!p.PassportExpiry || p.PassportExpiry === '') return true;
        // Passport must be valid for at least 6 months beyond travel date
        const minExpiry = addMonths(parseISO(travelDate), 6);
        return !isBefore(parseISO(p.PassportExpiry), minExpiry);
      },
      {
        message: 'Passport must be valid for at least 6 months beyond the travel date',
        path: ['PassportExpiry'],
      }
    );
}

export type PassengerFormValues = z.infer<ReturnType<typeof createPassengerSchema>>;
