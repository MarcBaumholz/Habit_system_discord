/**
 * Test script to verify proof matching logic
 * This tests the new matchHabitDirectly function
 */

// Mock habit data
const habits = [
  {
    id: '1',
    name: 'Lesen 10min pro Tag, Reading',
    smartGoal: 'Read for 10 minutes every day',
    minimalDose: '10 minutes'
  },
  {
    id: '2',
    name: 'Journaling, Morning Pages',
    smartGoal: 'Write 3 pages every morning',
    minimalDose: '1 page'
  },
  {
    id: '3',
    name: 'Exercise, Sport',
    smartGoal: 'Exercise for 30 minutes daily',
    minimalDose: '15 minutes'
  }
];

/**
 * Match habit directly from message content
 */
function matchHabitDirectly(habits, messageContent) {
  const normalizedContent = messageContent.trim().toLowerCase();
  console.log(`🔍 MATCH_HABIT_DIRECTLY: Analyzing message: "${normalizedContent}"`);
  console.log(`🔍 MATCH_HABIT_DIRECTLY: Available habits: ${habits.map(h => `"${h.name}"`).join(', ')}`);

  // Score each habit based on keyword matches
  const habitScores = habits.map(habit => {
    let score = 0;
    const habitName = habit.name.toLowerCase();

    // Extract all meaningful words from habit name (including comma-separated parts)
    const habitWords = habitName
      .split(/[,\s]+/)
      .map(w => w.trim())
      .filter(w => w.length > 2);

    console.log(`🔍 Checking habit: "${habit.name}" with keywords: ${habitWords.join(', ')}`);

    // Check each habit word
    habitWords.forEach(word => {
      if (normalizedContent.includes(word)) {
        score += 10;
        console.log(`✅ Found keyword "${word}" in message: +10 points`);
      }
    });

    // Also check SMART goal for additional keywords
    if (habit.smartGoal) {
      const goalWords = habit.smartGoal.toLowerCase()
        .split(/[,\s]+/)
        .map(w => w.trim())
        .filter(w => w.length > 3);

      goalWords.forEach(word => {
        if (normalizedContent.includes(word)) {
          score += 5;
          console.log(`✅ Found goal keyword "${word}" in message: +5 points`);
        }
      });
    }

    console.log(`📊 Final score for "${habit.name}": ${score}`);
    return { habit, score };
  });

  // Sort by score (highest first)
  habitScores.sort((a, b) => b.score - a.score);

  const bestMatch = habitScores[0];

  // Only return a match if score is above threshold
  if (bestMatch && bestMatch.score >= 10) {
    console.log(`🎯 MATCH_HABIT_DIRECTLY: Best match found: "${bestMatch.habit.name}" (score: ${bestMatch.score})`);
    return bestMatch.habit;
  }

  console.log('❌ MATCH_HABIT_DIRECTLY: No match found with sufficient score');
  return null;
}

// Test cases
console.log('\n========== TEST 1: "Proof lesen 20min" ==========');
const result1 = matchHabitDirectly(habits, 'Proof lesen 20min');
console.log('Result:', result1 ? result1.name : 'NO MATCH');

console.log('\n========== TEST 2: "Proof lesen Reading Versuch 2" ==========');
const result2 = matchHabitDirectly(habits, 'Proof lesen Reading Versuch 2');
console.log('Result:', result2 ? result2.name : 'NO MATCH');

console.log('\n========== TEST 3: "morning pages journaling" ==========');
const result3 = matchHabitDirectly(habits, 'morning pages journaling');
console.log('Result:', result3 ? result3.name : 'NO MATCH');

console.log('\n========== TEST 4: "Exercise 30min" ==========');
const result4 = matchHabitDirectly(habits, 'Exercise 30min');
console.log('Result:', result4 ? result4.name : 'NO MATCH');

console.log('\n========== TEST 5: "reading 15 minutes" ==========');
const result5 = matchHabitDirectly(habits, 'reading 15 minutes');
console.log('Result:', result5 ? result5.name : 'NO MATCH');

console.log('\n========== SUMMARY ==========');
console.log('Test 1 (lesen):', result1 ? '✅ PASS' : '❌ FAIL');
console.log('Test 2 (lesen + reading):', result2 ? '✅ PASS' : '❌ FAIL');
console.log('Test 3 (journaling):', result3 ? '✅ PASS' : '❌ FAIL');
console.log('Test 4 (exercise):', result4 ? '✅ PASS' : '❌ FAIL');
console.log('Test 5 (reading):', result5 ? '✅ PASS' : '❌ FAIL');
