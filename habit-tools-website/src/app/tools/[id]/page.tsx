import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { HABIT_TOOLS } from '@/data/tools';
import { Star, Clock, Users, ArrowLeft, ExternalLink, Lightbulb, Target } from 'lucide-react';

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
        }`}
      />
    ));
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Breadcrumb */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/tools" 
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Tools
          </Link>
        </div>
      </section>

      {/* Tool Header */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-effect rounded-xl p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 ${tool.color} rounded-xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-2xl">
                    {tool.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(tool.difficulty)}`}>
                      {tool.difficulty}
                    </span>
                    <div className="flex items-center space-x-1">
                      {renderStars(tool.effectiveness)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">{tool.effectiveness}/5</div>
                <div className="text-sm text-gray-400">Effectiveness</div>
              </div>
            </div>

            <p className="text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">{tool.summary}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{tool.timeToImplement}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{tool.language === 'both' ? 'English & German' : tool.language.toUpperCase()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>{tool.categories.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="glass-effect rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">About This Tool</h2>
                <p className="text-gray-300 leading-relaxed">{tool.description}</p>
              </div>

              {/* When to Use */}
              <div className="glass-effect rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-blue-400" />
                  When to Use
                </h2>
                <ul className="space-y-3">
                  {tool.whenToUse.map((use, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{use}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div className="glass-effect rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">How to Apply</h2>
                <div className="space-y-4">
                  {tool.steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Examples */}
              {tool.examples && tool.examples.length > 0 && (
                <div className="glass-effect rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4">Real-World Examples</h2>
                  <div className="space-y-4">
                    {tool.examples.map((example, index) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-300 italic">&ldquo;{example}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {tool.tips && tool.tips.length > 0 && (
                <div className="glass-effect rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Lightbulb className="w-6 h-6 mr-2 text-yellow-400" />
                    Pro Tips
                  </h2>
                  <ul className="space-y-3">
                    {tool.tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="text-white">{tool.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Setup Time:</span>
                    <span className="text-white">{tool.timeToImplement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Effectiveness:</span>
                    <div className="flex items-center space-x-1">
                      {renderStars(tool.effectiveness)}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Languages:</span>
                    <span className="text-white">{tool.language === 'both' ? 'EN/DE' : tool.language.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {tool.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-gray-700/50 rounded-md text-sm text-gray-300"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sources */}
              {tool.sources && tool.sources.length > 0 && (
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Sources & References</h3>
                  <div className="space-y-2">
                    {tool.sources.map((source, index) => (
                      <a
                        key={index}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">Learn More</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="button-primary w-full">
                  Try This Tool
                </button>
                <button className="button-secondary w-full">
                  Save to Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Related Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HABIT_TOOLS
              .filter(t => t.id !== tool.id && t.categories.some(cat => tool.categories.includes(cat)))
              .slice(0, 4)
              .map((relatedTool) => (
                <Link
                  key={relatedTool.id}
                  href={`/tools/${relatedTool.id}`}
                  className="glass-effect rounded-lg p-4 card-hover block"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${relatedTool.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold">
                        {relatedTool.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{relatedTool.name}</h3>
                      <p className="text-sm text-gray-400">{relatedTool.summary}</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}