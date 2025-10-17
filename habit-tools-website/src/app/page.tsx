import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ProcessSection from '@/components/ProcessSection';
import ToolCard from '@/components/ToolCard';
import NotionTemplateSection from '@/components/NotionTemplateSection';
import CommunitySection from '@/components/CommunitySection';
import Footer from '@/components/Footer';
import { HABIT_TOOLS } from '@/data/tools';

export default function Home() {
  // Zeige die ersten 6 Tools auf der Homepage
  const featuredTools = HABIT_TOOLS.slice(0, 6);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <ProcessSection />
      
      {/* Featured Habit Tools Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Beliebte Habit Tools
            </h2>
            <p className="text-xl text-[var(--notion-text-secondary)] max-w-3xl mx-auto">
              Starte mit diesen bewährten Techniken, die Tausenden geholfen haben, bessere Gewohnheiten aufzubauen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.id}`}>
                <ToolCard tool={tool} />
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/tools" className="button-primary text-lg px-8 py-4">
              Alle {HABIT_TOOLS.length} Tools ansehen →
            </Link>
          </div>
        </div>
      </section>

      <NotionTemplateSection />
      <CommunitySection />
      <Footer />
    </main>
  );
}