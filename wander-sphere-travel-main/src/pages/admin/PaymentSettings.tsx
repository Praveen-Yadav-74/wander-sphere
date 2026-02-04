import React, { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle, ShieldAlert, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiRequest } from '@/utils/api';
import { apiConfig } from '@/config/api';

const PaymentSettings = () => {
    const [activeGateway, setActiveGateway] = useState<'RAZORPAY' | 'PHONEPE'>('RAZORPAY'); // Default, ideally fetch from backend on load
    const [loading, setLoading] = useState(false);

    const switchGateway = async (gateway: 'RAZORPAY' | 'PHONEPE') => {
        setLoading(true);
        try {
            const response = await apiRequest<any>(
                `${apiConfig.baseURL}/payment/switch-gateway`,
                {
                    method: 'POST',
                    body: { gateway }
                }
            );
            if (response.success) {
                setActiveGateway(gateway);
                toast.success(`Payment Switch Active: ${gateway}`);
            } else {
                toast.error('Failed to switch gateway');
            }
        } catch (error) {
            console.error('Switch error:', error);
            toast.error('Network error switching gateway');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Engine Control</h1>
                    <p className="text-gray-500 mt-2">Managing the Hybrid Payment Switch System</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Razorpay Card */}
                    <div 
                        onClick={() => switchGateway('RAZORPAY')}
                        className={`
                            relative cursor-pointer group rounded-3xl p-8 border-2 transition-all duration-300
                            ${activeGateway === 'RAZORPAY' 
                                ? 'bg-white border-blue-600 shadow-xl shadow-blue-100 ring-4 ring-blue-50' 
                                : 'bg-white border-gray-100 hover:border-blue-200 grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}
                        `}
                    >
                        {activeGateway === 'RAZORPAY' && (
                            <div className="absolute top-4 right-4 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> ACTIVE
                            </div>
                        )}
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20 text-white">
                            <CreditCard className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Razorpay</h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Standard client-side SDK implementation. Best for cards and netbanking flow.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex gap-2 items-center"><ShieldCheck className="w-4 h-4 text-green-500"/> Settlements: T+2 days</li>
                            <li className="flex gap-2 items-center"><ShieldCheck className="w-4 h-4 text-green-500"/> Success Rate: ~92%</li>
                        </ul>
                    </div>

                    {/* PhonePe Card */}
                    <div 
                        onClick={() => switchGateway('PHONEPE')}
                        className={`
                            relative cursor-pointer group rounded-3xl p-8 border-2 transition-all duration-300
                            ${activeGateway === 'PHONEPE' 
                                ? 'bg-white border-purple-600 shadow-xl shadow-purple-100 ring-4 ring-purple-50' 
                                : 'bg-white border-gray-100 hover:border-purple-200 grayscale opacity-70 hover:opacity-100 hover:grayscale-0'}
                        `}
                    >
                         {activeGateway === 'PHONEPE' && (
                            <div className="absolute top-4 right-4 text-purple-600 bg-purple-50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> ACTIVE
                            </div>
                        )}
                        <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-600/20 text-white">
                             <Smartphone className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">PhonePe</h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Server-to-Server integration with instant verified check. Zero-transaction fee on UPI.
                        </p>
                         <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex gap-2 items-center"><ShieldCheck className="w-4 h-4 text-green-500"/> Settlements: Instant</li>
                            <li className="flex gap-2 items-center"><ShieldCheck className="w-4 h-4 text-green-500"/> Success Rate: ~96%</li>
                        </ul>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="mt-8 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <ArrowRightLeft className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Hybrid Switching Engine</p>
                            <p className="text-xs text-gray-500">Router status: <span className="text-green-600">Online</span></p>
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-sm font-medium text-gray-900">Current Gateway</p>
                         <p className={`text-xl font-bold ${activeGateway === 'PHONEPE' ? 'text-purple-600' : 'text-blue-600'}`}>
                             {activeGateway}
                         </p>
                    </div>
                </div>

                {loading && (
                    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"/>
                            <p className="font-medium text-gray-900">Switching Payment Gateways...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSettings;
