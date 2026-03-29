/**
 * SeatMap – Clean Premium Light Theme
 */

import type { SeatMapSegment, SeatInfo } from '@/types/flight';

interface Props {
  seatMap: SeatMapSegment[];
  onSeatSelect: (segmentIndex: number, seatCode: string) => void;
  selectedSeats: Record<number, string>;
}

const STATUS_STYLES: Record<string, string> = {
  Available:          'bg-[#ECFDF5] border-[#6EE7B7] text-[#059669] hover:bg-[#D1FAE5] cursor-pointer hover:scale-105',
  AvailableChargeable:'bg-[#EFF6FF] border-[#93C5FD] text-[#2563EB] hover:bg-[#DBEAFE] cursor-pointer hover:scale-105',
  Occupied:           'bg-[#FEF2F2] border-[#FECACA] text-[#EF4444]/50 cursor-not-allowed',
  LadiesOnly:         'bg-[#FDF4FF] border-[#E9D5FF] text-[#9333EA] hover:bg-[#F3E8FF] cursor-pointer hover:scale-105',
  Blocked:            'bg-[#F8FAFC] border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed',
  Selected:           'bg-[#0EA5E9] border-[#0284C7] text-white cursor-pointer shadow-md shadow-[#0EA5E9]/30 scale-105',
};

import { formatPrice } from '@/utils/etravDate';

function SeatButton({ seat, isSelected, onSelect }: { seat: SeatInfo; isSelected: boolean; onSelect: () => void }) {
  let status: string = isSelected ? 'Selected' : seat.Status;
  if (!isSelected && seat.Status === 'Available' && (seat.Amount || 0) > 0) status = 'AvailableChargeable';
  const isClickable = seat.Status === 'Available' || seat.Status === 'LadiesOnly' || isSelected;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={isClickable ? onSelect : undefined}
      title={`Seat ${seat.SeatNo} \u2013 ${seat.Status}${seat.Amount > 0 ? ` (+ ${formatPrice(seat.Amount)})` : ''}`}
      className={`w-8 h-9 rounded-t-lg border text-[10px] font-bold transition-all duration-150 ${STATUS_STYLES[status] ?? STATUS_STYLES.Available}`}
    >
      {seat.SeatNo}
    </button>
  );
}

export function SeatMap({ seatMap, onSeatSelect, selectedSeats }: Props) {
  if (seatMap.length === 0) {
    return (
      <div className="text-center py-12 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
        <p className="text-[#64748B] font-medium text-sm">Seat map not available for this flight.</p>
        <p className="text-[#94A3B8] text-xs mt-1">A seat will be auto-assigned at check-in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Available', cls: 'bg-[#ECFDF5] border-[#6EE7B7]', dot: 'bg-[#059669]' },
          { label: 'Selected (You)', cls: 'bg-[#0EA5E9] border-[#0284C7]', dot: 'bg-white' },
          { label: 'Extra Legroom', cls: 'bg-[#EFF6FF] border-[#93C5FD]', dot: 'bg-[#2563EB]' },
          { label: 'Ladies Only', cls: 'bg-[#FDF4FF] border-[#E9D5FF]', dot: 'bg-[#9333EA]' },
          { label: 'Occupied', cls: 'bg-[#FEF2F2] border-[#FECACA]', dot: 'bg-[#EF4444]/50' },
        ].map(({ label, cls, dot }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md border ${cls} flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${dot}`} />
            </div>
            <span className="text-[#64748B] text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>

      {seatMap.map((segment, segIdx) => (
        <div key={segIdx} className="space-y-4">
          <div className="flex items-center gap-3">
            <h4 className="text-[#0F172A] font-bold text-sm">
              {segment.Origin} → {segment.Destination}
            </h4>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E9] bg-[#E0F2FE] border border-[#BAE6FD] px-2.5 py-1 rounded-full">
              {segment.FlightNumber}
            </span>
          </div>

          {/* Selected seat confirmation */}
          {selectedSeats[segIdx] && (
            <div className="flex items-center gap-2 text-[#0EA5E9] text-xs font-bold bg-[#E0F2FE] border border-[#BAE6FD] px-4 py-2.5 rounded-xl w-fit">
              <svg className="w-4 h-4 text-[#0EA5E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Seat {selectedSeats[segIdx]} selected for this segment
            </div>
          )}

          {/* Cabin */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 overflow-x-auto">
            {/* Aircraft nose */}
            <div className="text-center mb-4">
              <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-1.5 rounded-full">
                ✈ Front of Aircraft
              </span>
            </div>

            {/* Column headers */}
            <div className="flex gap-1 mb-3 pl-10">
              {['A', 'B', 'C', '', 'D', 'E', 'F'].map((col, i) => (
                <div key={i} className={`w-8 text-center text-[10px] text-[#94A3B8] font-bold uppercase ${col === '' ? 'opacity-0' : ''}`}>
                  {col}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              {segment.RowDetails.map((row) => (
                <div key={row.RowNo} className="flex items-center gap-1">
                  <span className="w-8 text-right text-[10px] text-[#94A3B8] font-bold mr-1">{row.RowNo}</span>
                  {row.Seats.map((seat, seatIdx) => (
                    <div key={seat.Code} className={seatIdx === 3 ? 'ml-4' : ''}>
                      <SeatButton
                        seat={seat}
                        isSelected={selectedSeats[segIdx] === seat.Code}
                        onSelect={() => onSeatSelect(segIdx, seat.Code)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
