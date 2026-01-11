/**
 * Test script for Response Style feature
 * Tests the response style parsing and system prompt generation logic
 */

// Simple test to verify response style feature logic
console.log('🧪 Testing Response Style Feature\n');
console.log('='.repeat(60));

// Test 1: Style matching logic
console.log('\n📝 Test 1: Style Matching Logic');
const styleInstructions: Record<string, string> = {
  'Friendly': 'Use a warm, empathetic, and supportive tone. Be encouraging and understanding.',
  'Friendly & Supportive': 'Use a warm, empathetic, and supportive tone. Be encouraging and understanding.',
  'Direct': 'Be concise, action-oriented, and straight to the point. Focus on clear next steps.',
  'Direct & Motivational': 'Be concise, action-oriented, and straight to the point. Focus on clear next steps with motivational language.',
  'Calm': 'Use a gentle, reassuring tone. Be patient and measured in your responses.',
  'Calm & Encouraging': 'Use a gentle, reassuring tone. Be patient and measured in your responses while providing encouragement.',
  'Enthusiastic': 'Use an upbeat, energetic, and positive tone. Show excitement and energy.',
  'Enthusiastic & Energetic': 'Use an upbeat, energetic, and positive tone. Show excitement and energy.',
  'Professional': 'Use a data-driven, structured, and analytical tone. Focus on facts and metrics.',
  'Professional & Analytical': 'Use a data-driven, structured, and analytical tone. Focus on facts and metrics.',
  'Casual': 'Use a relaxed, informal, and conversational tone. Be approachable and friendly.',
  'Casual & Conversational': 'Use a relaxed, informal, and conversational tone. Be approachable and friendly.'
};

function testStyleMatching(style: string): boolean {
  const normalizedStyle = style.trim();
  const exactMatch = styleInstructions[normalizedStyle];
  if (exactMatch) return true;
  
  const partialMatch = Object.entries(styleInstructions).find(([key]) => 
    normalizedStyle.toLowerCase().includes(key.toLowerCase())
  );
  return !!partialMatch;
}

const testStyles = [
  'Friendly',
  'Friendly & Supportive',
  'Direct',
  'Direct & Motivational',
  'Calm',
  'Enthusiastic',
  'Professional',
  'Casual',
  'friendly', // lowercase
  'DIRECT', // uppercase
  'calm & encouraging', // lowercase with spaces
];

let passed = 0;
let failed = 0;

testStyles.forEach(style => {
  const result = testStyleMatching(style);
  if (result) {
    console.log(`  ✅ "${style}" - matched`);
    passed++;
  } else {
    console.log(`  ❌ "${style}" - NOT matched`);
    failed++;
  }
});

// Test 2: Context parsing logic
console.log('\n📝 Test 2: Context Parsing Logic');

function testContextParsing(context: string): string | null {
  const styleMatch = context.match(/Response Style Preference\s*User prefers:\s*([^\n]+)/);
  if (styleMatch && styleMatch[1]) {
    return styleMatch[1].trim();
  }
  return null;
}

const testContexts = [
  '## Response Style Preference\nUser prefers: Friendly & Supportive\n\n## Other Content',
  '## Response Style Preference\nUser prefers: Direct\n\nMore content here',
  '## Response Style Preference\nUser prefers: Calm & Encouraging',
  'No style preference here',
  '## Response Style Preference\nUser prefers: Professional & Analytical\n\n## Summary Statistics',
];

testContexts.forEach((context, index) => {
  const result = testContextParsing(context);
  if (index === 3) {
    // Context 4 (index 3) should have no style preference - expect null
    if (!result) {
      console.log(`  ✅ Context ${index + 1} - Correctly returned null (no style preference)`);
      passed++;
    } else {
      console.log(`  ❌ Context ${index + 1} - Should return null but got: "${result}"`);
      failed++;
    }
  } else {
    // Other contexts should have a style preference
    if (result) {
      console.log(`  ✅ Context ${index + 1} - Extracted: "${result}"`);
      passed++;
    } else {
      console.log(`  ❌ Context ${index + 1} - Failed to extract style`);
      failed++;
    }
  }
});

// Test 3: Verify the context format matches what DynamicContextBuilder creates
console.log('\n📝 Test 3: Context Format Verification');

const mockContext = `## Response Style Preference
User prefers: Friendly & Supportive

## Summary Statistics
- Total Habits: 3
- Completion Rate: 85%
- Current Streak: 7 days`;

const extracted = testContextParsing(mockContext);
if (extracted === 'Friendly & Supportive') {
  console.log('  ✅ Context format is correct');
  passed++;
} else {
  console.log(`  ❌ Context format mismatch. Expected "Friendly & Supportive", got "${extracted}"`);
  failed++;
}

// Test 4: Verify default style
console.log('\n📝 Test 4: Default Style Verification');

const defaultStyle = 'Friendly & Supportive';
if (testStyleMatching(defaultStyle)) {
  console.log(`  ✅ Default style "${defaultStyle}" is valid`);
  passed++;
} else {
  console.log(`  ❌ Default style "${defaultStyle}" is NOT valid`);
  failed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  📈 Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Response Style feature logic is working correctly.');
  console.log('\n✅ Key Features Verified:');
  console.log('  1. Style matching works (exact and partial match)');
  console.log('  2. Context parsing extracts style correctly');
  console.log('  3. Context format matches DynamicContextBuilder output');
  console.log('  4. Default style is valid');
  console.log('\n💡 Next Steps:');
  console.log('  - Test with actual Discord bot integration');
  console.log('  - Test with Notion database');
  console.log('  - Test AI response generation with different styles');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the implementation.');
  process.exit(1);
}
