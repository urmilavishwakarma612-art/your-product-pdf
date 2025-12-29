import { motion } from "framer-motion";
import { Zap, Github, Twitter, Linkedin, Heart } from "lucide-react";
import { Link } from "react-router-dom";

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
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Refund Policy", href: "#" },
  ],
};

const socialLinks = [
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="py-16 border-t border-border/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-primary/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <Link to="/" className="flex items-center gap-2.5 group">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25"
                >
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <span className="font-bold text-xl group-hover:text-primary transition-colors">Nexalgotrix</span>
              </Link>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6"
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
                  className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
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
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block hover:translate-x-1 duration-200"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block hover:translate-x-1 duration-200"
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
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block hover:translate-x-1 duration-200"
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
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block hover:translate-x-1 duration-200"
                  >
                    {link.label}
                  </a>
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
          className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nexalgotrix. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Made with <Heart className="w-4 h-4 text-destructive mx-1 animate-pulse" /> for DSA enthusiasts
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
