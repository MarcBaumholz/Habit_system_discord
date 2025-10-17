'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Download } from 'lucide-react';
import Link from 'next/link';

export default function NotionTemplateSection() {
  return (
    <section id="notion-template" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Notion Template
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Lade dir unser strukturiertes Notion Template herunter und starte sofort mit der Umsetzung deiner Gewohnheitsziele.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                'Vorgefertigte Strukturen für alle Toolboxen',
                'Automatische Tracking-Systeme',
                'Progress-Visualisierungen',
                'Community-Integration',
              ].map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-lg">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="#" className="button-primary text-lg px-8 py-4 inline-flex items-center gap-3">
              <Download className="w-5 h-5" />
              Template herunterladen
            </Link>
          </motion.div>

          {/* Right Side - Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="glass-effect rounded-2xl p-6 shadow-2xl">
              {/* Mockup Header */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>

              {/* Mockup Content */}
              <div className="bg-[#1a1f2e] rounded-xl p-6">
                <h4 className="text-2xl font-bold mb-4">Habit Toolbox - Fitness</h4>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">75% Complete</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full gradient-bg"
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                </div>

                {/* Mock Tasks */}
                <div className="space-y-3">
                  {[
                    { text: 'Morning workout routine', completed: true },
                    { text: 'Track daily progress', completed: true },
                    { text: 'Evening stretching', completed: true },
                    { text: 'Weekly review', completed: false },
                  ].map((task, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        task.completed 
                          ? 'bg-purple-500 border-purple-500' 
                          : 'border-gray-600'
                      }`}>
                        {task.completed && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

