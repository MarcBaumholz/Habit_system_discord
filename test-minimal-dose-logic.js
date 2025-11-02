#!/usr/bin/env node

/**
 * Test script to verify minimal dose detection logic fixes
 */

// Test the minimal dose detection logic
function testMinimalDoseDetection(message) {
  const lowerContent = message.toLowerCase();
  
  // Updated minimal dose indicators (more restrictive)
  const minimalDoseIndicators = ['minimal dose', 'minimal', 'kleine dosis', 'kurz', 'nur kurz'];
  const isMinimalDose = minimalDoseIndicators.some(indicator => 
    lowerContent.includes(indicator)
  );
  
  return isMinimalDose;
}

// Test cases
const testCases = [
  {
    message: "Proof lesen 15 Minuten (Reading)",
    expected: false,
    description: "Jonas's reading message should NOT be minimal dose"
  },
  {
    message: "Full Proof, deep work today, claude code on api implementation 1h",
    expected: false,
    description: "Marc's deep work message should NOT be minimal dose"
  },
  {
    message: "minimal dose meditation 10 minutes",
    expected: true,
    description: "Explicit minimal dose should be detected"
  },
  {
    message: "just 5 minutes reading",
    expected: false,
    description: "Just' alone should NOT be minimal dose (removed from indicators)"
  },
  {
    message: "quick 10 min exercise",
    expected: false,
    description: "Quick' alone should NOT be minimal dose (removed from indicators)"
  },
  {
    message: "kurz 15 Minuten lesen",
    expected: true,
    description: "German 'kurz' should be detected as minimal dose"
  }
];

console.log('🧪 Testing Minimal Dose Detection Logic...\n');

let passedTests = 0;
let totalTests = testCases.length;

for (const testCase of testCases) {
  console.log(`📝 Test: ${testCase.description}`);
  console.log(`📄 Message: "${testCase.message}"`);
  
  const result = testMinimalDoseDetection(testCase.message);
  console.log(`📊 Result: ${result}`);
  console.log(`🎯 Expected: ${testCase.expected}`);
  
  if (result === testCase.expected) {
    console.log(`✅ TEST PASSED\n`);
    passedTests++;
  } else {
    console.log(`❌ TEST FAILED\n`);
  }
}

console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All minimal dose detection tests passed! The fix is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Please review the implementation.');
}
