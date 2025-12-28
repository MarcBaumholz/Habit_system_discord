// Canvas is optional - trend graphs will be disabled if canvas module is not available
let createCanvas: any = null;
try {
  const canvasModule = require('canvas');
  createCanvas = canvasModule.createCanvas;
} catch (error) {
  console.warn('⚠️ Canvas module not available - trend graphs will be disabled');
}

import { Proof } from '../types';

interface WeeklyData {
  week: number;
  proofCount: number;
}

/**
 * Calculate weekly proof counts from first proof date
 */
function calculateWeeklyData(proofs: Proof[]): WeeklyData[] | null {
  if (proofs.length === 0) {
    return null;
  }

  // Sort proofs by date and find the earliest
  const sortedProofs = [...proofs].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstProofDate = new Date(sortedProofs[0].date);
  firstProofDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate total days since first proof
  const totalDays = Math.floor((today.getTime() - firstProofDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate total weeks (round up)
  const totalWeeks = Math.ceil(totalDays / 7);

  // Need at least 4 weeks of data
  if (totalWeeks < 4) {
    return null;
  }

  // Group proofs by week
  const weeklyData: WeeklyData[] = [];
  
  for (let week = 1; week <= totalWeeks; week++) {
    const weekStartDay = (week - 1) * 7 + 1;
    const weekEndDay = week * 7;
    
    const weekStartDate = new Date(firstProofDate);
    weekStartDate.setDate(firstProofDate.getDate() + weekStartDay - 1);
    weekStartDate.setHours(0, 0, 0, 0);
    
    const weekEndDate = new Date(firstProofDate);
    weekEndDate.setDate(firstProofDate.getDate() + weekEndDay - 1);
    weekEndDate.setHours(23, 59, 59, 999);

    // Count proofs in this week
    const weekProofs = sortedProofs.filter(proof => {
      const proofDate = new Date(proof.date);
      proofDate.setHours(0, 0, 0, 0);
      return proofDate >= weekStartDate && proofDate <= weekEndDate;
    });

    weeklyData.push({
      week,
      proofCount: weekProofs.length
    });
  }

  return weeklyData;
}

/**
 * Generate trend graph as PNG buffer
 * Returns null if less than 4 weeks of data exist
 */
export async function generateTrendGraph(
  habitId: string,
  proofs: Proof[],
  habitName: string
): Promise<Buffer | null> {
  // Return null if canvas module is not available
  if (!createCanvas) {
    console.warn('⚠️ Trend graph requested but canvas module not available');
    return null;
  }

  try {
    // Calculate weekly data
    const weeklyData = calculateWeeklyData(proofs);
    
    if (!weeklyData || weeklyData.length < 4) {
      return null;
    }

    const weeks = weeklyData.map(d => d.week);
    const proofCounts = weeklyData.map(d => d.proofCount);
    
    // Calculate image dimensions
    const numWeeks = weeks.length;
    const baseWidth = 800;
    const minWidth = 800;
    const maxWidth = 1600;
    const width = Math.min(Math.max(baseWidth, numWeeks * 100), maxWidth);
    const height = 400;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Set up drawing area with padding
    const padding = { top: 60, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Find max proof count for scaling
    const maxProofs = Math.max(...proofCounts, 1);
    const yMax = Math.ceil(maxProofs * 1.1); // Add 10% padding
    
    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    
    // Vertical grid lines (one per week)
    for (let i = 0; i < numWeeks; i++) {
      const x = padding.left + (chartWidth / (numWeeks - 1)) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();
    
    // Draw trend line
    const points: { x: number; y: number }[] = [];
    
    for (let i = 0; i < numWeeks; i++) {
      const x = padding.left + (chartWidth / (numWeeks - 1)) * i;
      const y = height - padding.bottom - (proofCounts[i] / yMax) * chartHeight;
      points.push({ x, y });
    }
    
    // Determine line color based on trend
    const firstHalf = proofCounts.slice(0, Math.floor(numWeeks / 2));
    const secondHalf = proofCounts.slice(Math.floor(numWeeks / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let lineColor = '#6B7280'; // Gray for stable
    if (secondAvg > firstAvg * 1.1) {
      lineColor = '#3B82F6'; // Blue for upward
    } else if (secondAvg < firstAvg * 0.9) {
      lineColor = '#EF4444'; // Red for downward
    }
    
    // Draw line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = lineColor;
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // White center for better visibility
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = lineColor;
    }
    
    // Draw title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${habitName} - Wochen-Trend`, width / 2, 30);
    
    // Draw X-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    const labelRotation = numWeeks > 8;
    if (labelRotation) {
      ctx.save();
      ctx.translate(padding.left, height - padding.bottom + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'right';
      
      for (let i = 0; i < numWeeks; i++) {
        const x = (chartWidth / (numWeeks - 1)) * i;
        ctx.fillText(`Week ${weeks[i]}`, x, 0);
      }
      ctx.restore();
    } else {
      for (let i = 0; i < numWeeks; i++) {
        const x = padding.left + (chartWidth / (numWeeks - 1)) * i;
        ctx.fillText(`Week ${weeks[i]}`, x, height - padding.bottom + 20);
      }
    }
    
    // Draw Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= gridLines; i++) {
      const value = Math.round((yMax / gridLines) * (gridLines - i));
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.fillText(value.toString(), padding.left - 10, y);
    }
    
    // Convert to buffer
    return canvas.toBuffer('image/png');
    
  } catch (error) {
    console.error('❌ Error generating trend graph:', error);
    return null;
  }
}
