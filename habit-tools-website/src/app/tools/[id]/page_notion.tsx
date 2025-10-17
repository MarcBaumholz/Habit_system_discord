import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HABIT_TOOLS } from '@/data/tools';
import { ArrowLeft, Clock, Target, Lightbulb, BookOpen, CheckCircle2, ExternalLink } from 'lucide-react';

interface ToolDetailPageProps {
  params: {
    id: string;
  };
}

export default function ToolDetailPage({ params }: ToolDetailPageProps) {
  const tool = HABIT_TOOLS.find(t => t.id === params.id);

  if (!tool) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Notion-Style Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Breadcrumb */}
        <Link 
          href="/tools" 
          className="inline-flex items-center text-sm text-[var(--notion-text-secondary)] hover:text-[var(--notion-accent)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Alle Tools
        </Link>

        {/* Page Icon & Title */}
        <div className="mb-8">
          <div className="text-7xl mb-6 leading-none">
            {tool.emoji || '🎯'}
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            {tool.name}
          </h1>
          <p className="text-xl text-[var(--notion-text-secondary)] leading-relaxed">
            {tool.summary}
          </p>
        </div>

        {/* Properties Grid (Notion-Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="notion-card">
            <div className="text-xs text-[var(--notion-text-secondary)] mb-1">Schwierigkeit</div>
            <div className="text-sm font-medium">{tool.difficulty}</div>
          </div>
          <div className="notion-card">
            <div className="text-xs text-[var(--notion-text-secondary)] mb-1">Zeitaufwand</div>
            <div className="text-sm font-medium">{tool.timeToImplement}</div>
          </div>
          <div className="notion-card">
            <div className="text-xs text-[var(--notion-text-secondary)] mb-1">Effektivität</div>
            <div className="text-sm font-medium">{tool.effectiveness}/5 ⭐</div>
          </div>
          <div className="notion-card">
            <div className="text-xs text-[var(--notion-text-secondary)] mb-1">Sprache</div>
            <div className="text-sm font-medium">{tool.language === 'both' ? 'DE/EN' : tool.language.toUpperCase()}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Beschreibung */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[var(--notion-accent)]" />
              <h2 className="text-2xl font-semibold">Über dieses Tool</h2>
            </div>
            <div className="notion-callout">
              <p className="text-[var(--notion-text)] leading-relaxed">
                {tool.description}
              </p>
            </div>
          </section>

          {/* Wann verwenden */}
          {tool.whenToUse && tool.whenToUse.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[var(--notion-green)]" />
                <h2 className="text-2xl font-semibold">Wann verwenden?</h2>
              </div>
              <div className="space-y-3">
                {tool.whenToUse.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--notion-green)] flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--notion-text-secondary)]">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Schritt-für-Schritt Anleitung */}
          {tool.steps && tool.steps.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-[var(--notion-accent)] flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                <h2 className="text-2xl font-semibold">Schritt-für-Schritt</h2>
              </div>
              <div className="space-y-4">
                {tool.steps.map((step, index) => (
                  <div key={index} className="notion-card flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-[var(--notion-accent)] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-[var(--notion-text)] flex-1 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Beispiele */}
          {tool.examples && tool.examples.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-[var(--notion-yellow)]" />
                <h2 className="text-2xl font-semibold">Praxis-Beispiele</h2>
              </div>
              <div className="space-y-3">
                {tool.examples.map((example, index) => (
                  <div key={index} className="notion-card bg-[var(--notion-surface-hover)] border-l-4 border-[var(--notion-yellow)]">
                    <p className="text-[var(--notion-text-secondary)] italic leading-relaxed">
                      "{example}"
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pro Tips */}
          {tool.tips && tool.tips.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-[var(--notion-accent)]" />
                <h2 className="text-2xl font-semibold">Pro Tipps</h2>
              </div>
              <div className="space-y-2">
                {tool.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--notion-accent)] flex-shrink-0 mt-2" />
                    <p className="text-[var(--notion-text-secondary)]">{tip}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quellen */}
          {tool.sources && tool.sources.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Quellen & Referenzen</h3>
              <div className="space-y-2">
                {tool.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[var(--notion-accent)] hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">Mehr erfahren</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-3 pt-8 border-t border-[var(--notion-border)]">
            <Link href="/tools" className="button-primary flex-1 justify-center">
              Mehr Tools entdecken
            </Link>
            <Link href="/search" className="button-secondary flex-1 justify-center">
              Ähnliche Tools finden
            </Link>
          </div>
        </div>

        {/* Related Tools */}
        {HABIT_TOOLS.filter(t => t.id !== tool.id && t.categories.some(cat => tool.categories.includes(cat))).length > 0 && (
          <section className="mt-16 pt-16 border-t border-[var(--notion-border)]">
            <h2 className="text-2xl font-semibold mb-6">Ähnliche Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HABIT_TOOLS
                .filter(t => t.id !== tool.id && t.categories.some(cat => tool.categories.includes(cat)))
                .slice(0, 4)
                .map((relatedTool) => (
                  <Link
                    key={relatedTool.id}
                    href={`/tools/${relatedTool.id}`}
                    className="notion-card flex items-center gap-4 group"
                  >
                    <div className="text-3xl">{relatedTool.emoji || '🎯'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--notion-accent)] transition-colors">
                        {relatedTool.name}
                      </h3>
                      <p className="text-xs text-[var(--notion-text-secondary)] line-clamp-2">
                        {relatedTool.summary}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}

