'use client';

import { motion } from 'framer-motion';
import { Star, Clock, Users, ArrowRight } from 'lucide-react';
import { HabitTool } from '@/types/tools';

interface ToolCardProps {
  tool: HabitTool;
  onClick?: () => void;
}

export default function ToolCard({ tool, onClick }: ToolCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'Advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
        }`}
      />
    ));
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-effect rounded-xl p-6 card-hover cursor-pointer group h-full"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${tool.color} rounded-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">
              {tool.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
              {tool.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tool.difficulty)}`}>
                {tool.difficulty}
              </span>
              <span className="text-gray-400 text-sm">
                {tool.timeToImplement}
              </span>
            </div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
      </div>

      {/* Summary */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
        {tool.summary}
      </p>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tool.categories.slice(0, 2).map((category) => (
          <span
            key={category}
            className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-gray-300"
          >
            {category}
          </span>
        ))}
        {tool.categories.length > 2 && (
          <span className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-gray-300">
            +{tool.categories.length - 2}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
        <div className="flex items-center space-x-1">
          {renderStars(tool.effectiveness)}
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{tool.timeToImplement}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{tool.language === 'both' ? 'EN/DE' : tool.language.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
