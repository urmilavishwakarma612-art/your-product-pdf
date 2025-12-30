import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Cancellation & Refund Policy</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated on December 30, 2025</p>

          {/* Quick Summary Card */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground m-0">Quick Summary</h2>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">➡</span>
                <span><strong>Cancellation/Refund Request Time:</strong> Within 7 days of purchase</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">➡</span>
                <span><strong>Refund Processing Time:</strong> 3 to 5 business days</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">➡</span>
                <span><strong>Support Email:</strong> hello.nexalgotrix@gmail.com</span>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Refund Eligibility</h2>
            <p>
              At Nexalgotrix, operated by KUNAL VISHWAKARMA, we want you to be satisfied with your purchase. You are eligible for a full refund if:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You request a refund within <strong>7 days</strong> of your purchase date</li>
              <li>You have not excessively used the premium features</li>
              <li>You provide a valid reason for the refund request</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. How to Request a Refund</h2>
            <p>To request a refund, please follow these steps:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Send an email to <strong>hello.nexalgotrix@gmail.com</strong> with the subject line "Refund Request"</li>
              <li>Include your registered email address and order/transaction ID</li>
              <li>Provide a brief reason for the refund request</li>
              <li>Our team will review your request and respond within 24-48 hours</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Refund Processing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Once approved, refunds will be processed within <strong>3 to 5 business days</strong></li>
              <li>Refunds will be credited to the original payment method</li>
              <li>Bank processing times may vary; please allow additional time for the amount to reflect in your account</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Subscription Cancellation</h2>
            <p>For monthly subscriptions:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You can cancel your subscription at any time from your account settings</li>
              <li>Upon cancellation, you will retain access until the end of your current billing period</li>
              <li>No refunds will be provided for partial months</li>
              <li>Cancellation must be done before the next billing cycle to avoid charges</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. One-Time Purchase (Early Bird Offer)</h2>
            <p>For one-time early-bird purchases (₹449 lifetime access):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests must be made within <strong>7 days</strong> of purchase</li>
              <li>After 7 days, no refunds will be provided as this is a lifetime access offer</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Non-Refundable Situations</h2>
            <p>Refunds will NOT be provided in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Requests made after the 7-day refund window</li>
              <li>Violation of our Terms & Conditions</li>
              <li>Account suspension due to policy violations</li>
              <li>Change of mind after extensively using premium content</li>
              <li>Technical issues on user's end (internet, device compatibility)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Chargebacks</h2>
            <p>
              We encourage users to contact us directly for any billing disputes before initiating a chargeback with their bank. Unauthorized chargebacks may result in permanent account suspension.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting on this page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
            <p>
              For any questions or concerns regarding refunds, please reach out to us:
            </p>
            <p>
              <strong>Email:</strong> hello.nexalgotrix@gmail.com<br />
              <strong>Phone:</strong> 7985177849
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
