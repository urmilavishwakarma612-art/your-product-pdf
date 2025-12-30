import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Mail, Phone } from "lucide-react";
import { Footer } from "@/components/landing/Footer";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {/* Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Shipping & Delivery Policy</h1>
              <p className="text-muted-foreground text-sm mt-1">Last updated on Dec 30, 2025</p>
            </div>
          </div>

          {/* Policy Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">International Orders</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For International buyers, orders are shipped and delivered through registered international 
                  courier companies and/or International speed post only.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Domestic Orders</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For domestic buyers, orders are shipped through registered domestic courier companies 
                  and/or speed post only.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Shipping Timeline</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Orders are shipped within the timeframe specified or as per the delivery date agreed at 
                  the time of order confirmation. Delivery of the shipment is subject to Courier Company / 
                  post office norms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Liability Disclaimer</h2>
                <p className="text-muted-foreground leading-relaxed">
                  KUNAL VISHWAKARMA is not liable for any delay in delivery by the courier company / postal 
                  authorities and only guarantees to hand over the consignment to the courier company or 
                  postal authorities from the date of the order and payment or as per the delivery date 
                  agreed at the time of order confirmation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Delivery of all orders will be to the address provided by the buyer. Delivery of our 
                  services will be confirmed on your mail ID as specified during registration.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For any issues in utilizing our services you may contact our helpdesk:
                </p>
                <div className="flex flex-col gap-3">
                  <a 
                    href="tel:7985177849" 
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    7985177849
                  </a>
                  <a 
                    href="mailto:hello.nexalgotrix@gmail.com" 
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    hello.nexalgotrix@gmail.com
                  </a>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ShippingPolicy;
