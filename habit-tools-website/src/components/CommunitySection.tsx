'use client';

import { motion } from 'framer-motion';
import { Users, BarChart3, Target, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Users,
    text: 'Accountability Partner finden',
  },
  {
    icon: BarChart3,
    text: 'Wöchentliche Check-ins',
  },
  {
    icon: Target,
    text: 'Gemeinsame Ziele setzen',
  },
];

export default function CommunitySection() {
  return (
    <section id="community" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1a1f2e]/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Community & Accountability
          </h2>
          <h3 className="text-2xl font-semibold text-gray-300 mb-8">
            Schließe dich unserer WhatsApp Community an
          </h3>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Erfolg ist einfacher, wenn du nicht alleine bist. Tausche dich mit anderen aus, 
            teile deine Fortschritte und erhalte Motivation von Gleichgesinnten.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-effect rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-gray-300 font-medium">{feature.text}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <Link href="#" className="button-primary text-lg px-10 py-5 inline-flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            Community beitreten
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

