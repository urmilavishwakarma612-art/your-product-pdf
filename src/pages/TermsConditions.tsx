import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermsConditions = () => {
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

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated on December 30, 2025</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Agreement to Terms</h2>
            <p>
              By accessing or using Nexalgotrix ("Platform"), operated by KUNAL VISHWAKARMA, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Description of Services</h2>
            <p>
              Nexalgotrix is a digital learning platform focused on Data Structures and Algorithms (DSA) preparation for coding interviews. Our services include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Curated DSA patterns and problem sets</li>
              <li>AI-powered mentoring and hints</li>
              <li>Progress tracking and spaced repetition learning</li>
              <li>Premium subscription content</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>You must be at least 13 years old to use our platform.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Subscription & Payments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Free Content:</strong> Phase 1 (Basics) is available free of charge.</li>
              <li><strong>Premium Content:</strong> Phases 2-6 require a paid subscription at ₹49/month or ₹449 one-time early-bird offer.</li>
              <li><strong>Payment Processing:</strong> All payments are processed securely through Razorpay.</li>
              <li><strong>Subscription Renewal:</strong> Monthly subscriptions auto-renew unless cancelled.</li>
              <li><strong>Price Changes:</strong> We reserve the right to modify pricing with prior notice.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
            <p>
              All content on the Platform, including but not limited to text, graphics, logos, images, code examples, and educational materials, is the property of Nexalgotrix and is protected by intellectual property laws.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may not reproduce, distribute, or create derivative works without permission.</li>
              <li>You may not share your account or premium content with others.</li>
              <li>You may not use automated tools to scrape or download content.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Platform's functionality</li>
              <li>Upload malicious code or content</li>
              <li>Impersonate others or provide false information</li>
              <li>Share, resell, or redistribute premium content</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided "as is" without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>That the Platform will be uninterrupted or error-free</li>
              <li>Specific results from using our educational content</li>
              <li>Job placement or interview success</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Nexalgotrix shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violation of these terms. Upon termination, your right to access premium content will cease immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
            <p>
              For questions about these Terms & Conditions, please contact us at:
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

export default TermsConditions;
