import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
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

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated on December 30, 2025</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              Welcome to Nexalgotrix ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our digital learning platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, username, and password when you register for an account.</li>
              <li><strong>Profile Information:</strong> Avatar, bio, social media links, and other optional profile details.</li>
              <li><strong>Payment Information:</strong> Billing details processed through our secure payment partners (Razorpay).</li>
              <li><strong>Learning Data:</strong> Your progress, completed questions, notes, bookmarks, and performance statistics.</li>
              <li><strong>Communication Data:</strong> Messages you send to our support team or AI mentor.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, maintain, and improve our learning platform</li>
              <li>To personalize your learning experience and track your progress</li>
              <li>To process transactions and manage subscriptions</li>
              <li>To send you updates, newsletters, and marketing communications (with your consent)</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To detect, prevent, and address technical issues or fraudulent activities</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security assessments.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Data Sharing</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform (hosting, analytics, payment processing).</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, update, or delete your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Request a copy of your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
            <p>
              Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;
