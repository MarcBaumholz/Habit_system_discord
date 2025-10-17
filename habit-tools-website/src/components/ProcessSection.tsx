'use client';

import { motion } from 'framer-motion';

const processSteps = [
  {
    number: 1,
    title: 'Problem identifizieren',
    description: 'Definiere klar, welche Gewohnheit du ändern möchtest und warum.',
  },
  {
    number: 2,
    title: 'Toolbox wählen',
    description: 'Wähle die passende Toolbox für dein spezifisches Problem aus.',
  },
  {
    number: 3,
    title: 'Systematisch umsetzen',
    description: 'Folge dem strukturierten Ansatz und tracke deinen Fortschritt.',
  },
  {
    number: 4,
    title: 'Community nutzen',
    description: 'Schließe dich einer Accountability Group an für zusätzliche Motivation.',
  },
];

export default function ProcessSection() {
  return (
    <section id="process" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[var(--notion-border)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-3 text-[var(--notion-text)]">
            Der Habit Toolbox Prozess
          </h2>
          <p className="text-[var(--notion-text-secondary)]">
            Vier einfache Schritte zu besseren Gewohnheiten
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="notion-card text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="process-circle text-sm">
                  {step.number}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[var(--notion-text)]">{step.title}</h3>
              <p className="text-sm text-[var(--notion-text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

