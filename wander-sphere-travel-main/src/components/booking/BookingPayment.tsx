import React, { useState } from 'react';
import { CreditCard, Wallet, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface BookingPaymentProps {
    type?: 'flight' | 'hotel' | 'bus';
    amount?: number;
    details?: any;
}

const BookingPayment = ({ type = 'flight', amount = 4500, details }: BookingPaymentProps) => {
    const navigate = useNavigate();
    const [useWallet, setUseWallet] = useState(false);
    const walletBalance = 12500;
    
    // Calculate final
    const discount = useWallet ? Math.min(walletBalance, amount * 0.2) : 0; // Max 20% from wallet for example
    const finalAmount = amount - discount;

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Confirm & Pay</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left: Summary */}
                <div className="md:col-span-2 space-y-6">
                    {/* Trip Summary Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Trip Details</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                <div>
                                    <p className="text-sm text-gray-500">Route</p>
                                    <p className="font-semibold text-gray-900">Delhi <span className="text-gray-400 mx-1">→</span> Mumbai</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-semibold text-gray-900">12 Oct, 2024</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Traveller</p>
                                <p className="font-semibold text-gray-900">John Doe (+1 Adult)</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
                        
                        {/* Wallet Option */}
                        <div className="flex items-center justify-between p-4 mb-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-indigo-900">Wander Wallet</p>
                                    <p className="text-xs text-indigo-600">Balance: ₹{walletBalance.toLocaleString()}</p>
                                </div>
                            </div>
                            <Switch checked={useWallet} onCheckedChange={setUseWallet} />
                        </div>

                         <div className="space-y-3">
                            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors bg-white">
                                <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                </div>
                                <span className="font-medium text-gray-700">UPI / QR Code</span>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-4 ml-auto" />
                            </div>
                            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors bg-white opacity-60">
                                <div className="w-5 h-5 rounded-full border border-gray-300" />
                                <span className="font-medium text-gray-700">Credit / Debit Card</span>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Right: Price Breakdown */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 sticky top-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Fare Summary</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Base Fare</span>
                                <span>₹{amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Taxes & Fees</span>
                                <span>₹0</span>
                            </div>
                            {useWallet && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Wallet Discount</span>
                                    <span>- ₹{discount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-bold text-indigo-600">₹{finalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-600/20">
                            Pay ₹{finalAmount.toLocaleString()}
                        </Button>
                        
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>100% Secure Payment</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPayment;
