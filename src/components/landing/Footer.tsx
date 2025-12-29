import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";
const footerLinks = {
  product: [
    { label: "Patterns", href: "/patterns" },
    { label: "Pricing", href: "#pricing" },
    { label: "Features", href: "#features" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Tutorials", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Refund Policy", href: "/refund" },
    { label: "Shipping & Delivery", href: "/shipping" },
  ],
};

const socialLinks = [
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="py-10 sm:py-16 border-t border-border/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] bg-gradient-to-t from-primary/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 sm:mb-6"
            >
              <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
                >
                  <img src={logoImage} alt="Nexalgotrix Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                </motion.div>
                <span className="font-bold text-lg sm:text-xl group-hover:text-primary transition-colors">Nexalgotrix</span>
              </Link>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xs mb-4 sm:mb-6"
            >
              Master Data Structures & Algorithms through pattern-based learning. 
              AI-powered guidance for your coding journey.
            </motion.p>
            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-3"
            >
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.a>
              ))}
            </motion.div>
          </div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">Product</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link
                      to={link.href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-block hover:translate-x-1 duration-200"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-block hover:translate-x-1 duration-200"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">Resources</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-block hover:translate-x-1 duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">Legal</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-block hover:translate-x-1 duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-6 sm:pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4"
        >
          <div className="text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nexalgotrix. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            Made with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-destructive mx-1 animate-pulse" /> for DSA enthusiasts
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
