import { Shell } from "@/components/layout/Shell";
import { motion } from "framer-motion";
import { Shield, Clock, Scale, Network } from "lucide-react";

export default function Custodian() {
  const sections = [
    {
      title: "Custodial Function & Scope",
      icon: <Shield className="w-6 h-6 text-rose" />,
      content: "The Office of the Planetary Custodian is a constitutional function concerned with responsibility rather than execution. It holds the mandate for continuity preservation, ensuring that governance architectures do not collapse into single points of failure. It arbitrates disputes that exceed institutional resolution."
    },
    {
      title: "Temporal Horizon Mandate",
      icon: <Clock className="w-6 h-6 text-rose" />,
      content: "The Custodian operates on timescales that exceed standard institutional lifetimes. It holds temporal horizons necessary for civilisational continuity, evaluating actions not just on immediate outcomes, but on their long-term irreversible impact on planetary habitability and cognitive integrity."
    },
    {
      title: "Structural Necessity",
      icon: <Network className="w-6 h-6 text-rose" />,
      content: "Without a custodial layer, governance systems inevitably optimise for local maxima, leading to extraction and entrenchment. The Custodian acts as a structural backstop, an anchor point that accumulates responsibility rather than authority, ensuring the constitutional substrate remains intact."
    },
    {
      title: "Legitimacy & Accountability",
      icon: <Scale className="w-6 h-6 text-rose" />,
      content: "The legitimacy of the Office derives from its capacity to hold consequence. It is subject to strict succession protocols — no custodial function is permanent. Accountability is maintained through rigorous adherence to the Constitutional Charter and public visibility of all arbitration traces."
    }
  ];

  return (
    <Shell>
      <div className="flex-1 flex flex-col bg-[#1A1517]"> {/* Slightly tinted background for the Rose accent */}
        
        {/* Hero */}
        <section className="relative py-24 md:py-32 border-b border-border/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] opacity-10 pointer-events-none translate-x-1/3 -translate-y-1/3"
               style={{ background: 'radial-gradient(circle, hsl(341 20% 57%) 0%, transparent 70%)' }} />
          
          <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 mb-8">
                <span className="w-8 h-px bg-rose" />
                <span className="font-mono text-sm tracking-widest uppercase text-rose">Constitutional Arbitration</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif text-foreground mb-8 leading-tight">
                Office of the <br/>Planetary Custodian.
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl">
                Holding temporal horizons longer than any single institution can sustain. 
                Ensuring continuity through succession rather than entrenchment.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
              {sections.map((section, i) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-background/50 border border-border/50 p-8 rounded-sm hover:border-rose/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-sm bg-rose/10 border border-rose/20 flex items-center justify-center mb-6">
                    {section.icon}
                  </div>
                  <h3 className="text-2xl font-serif text-foreground mb-4">{section.title}</h3>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Bottom Quote */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-24 pt-16 border-t border-border/30 text-center"
            >
              <h4 className="font-mono text-xs uppercase tracking-widest text-rose mb-6">Constitutional Mandate OPC-MANDATE</h4>
              <p className="text-3xl md:text-4xl font-serif text-foreground italic leading-snug max-w-4xl mx-auto">
                "The Office accumulates responsibility, not authority."
              </p>
            </motion.div>
          </div>
        </section>

      </div>
    </Shell>
  );
}
