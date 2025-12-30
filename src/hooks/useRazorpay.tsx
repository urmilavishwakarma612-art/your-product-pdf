import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
    escape: boolean;
    backdropclose: boolean;
    confirm_close: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

type PlanType = 'monthly' | 'lifetime';

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async (
    planType: PlanType,
    onSuccess: () => void,
    onError?: (error: string) => void
  ) => {
    setIsLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please check your internet connection.');
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication error. Please login again.');
      }
      
      if (!session) {
        throw new Error('Please login to continue');
      }

      console.log('Creating Razorpay order for plan:', planType);

      // Create order (explicitly attach JWT to avoid missing-session issues)
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: { plan_type: planType },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      console.log('Order response:', { orderData, orderError });

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(orderError.message || 'Failed to create payment order');
      }
      
      if (!orderData?.order_id) {
        console.error('Invalid order response:', orderData);
        throw new Error(orderData?.error || 'Failed to create payment order - no order ID received');
      }

      // Configure Razorpay
      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Nexalgotrix',
        description: orderData.description,
        order_id: orderData.order_id,
        prefill: {
          name: orderData.prefill?.name || '',
          email: orderData.prefill?.email || '',
        },
        theme: {
          color: '#f59e0b',
        },
        handler: async (response: RazorpayResponse) => {
          try {
            console.log('Payment successful, verifying...', response);
            
            // Verify payment (explicitly attach JWT to avoid missing-session issues)
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_type: planType,
                },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              }
            );

            console.log('Verification response:', { verifyData, verifyError });

            if (verifyError) {
              console.error('Payment verification error:', verifyError);
              throw new Error(verifyError.message || 'Payment verification failed');
            }
            
            if (!verifyData?.success) {
              console.error('Verification failed:', verifyData);
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            toast.success('Payment successful! Welcome to Pro!');
            onSuccess();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Payment verification failed';
            console.error('Verification catch error:', err);
            toast.error(message);
            onError?.(message);
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
          escape: true,
          backdropclose: false,
          confirm_close: true,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setIsLoading(false);
      });
      razorpay.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment initiation failed';
      toast.error(message);
      onError?.(message);
      setIsLoading(false);
    }
  }, [loadRazorpayScript]);

  return {
    initiatePayment,
    isLoading,
  };
};
