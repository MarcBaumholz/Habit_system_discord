/**
 * Test script for GIF validation functionality
 * Tests if celebration GIFs are accessible before using them
 */

const CELEBRATION_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG01NmZneXMybmx5c2pjOTgweXk3MTZxZWdtOWFhY243dXR6NG9xcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3orieSQLr3L6lYpSo0/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjBzemNhZW5pemF6OTd1OG8wdDhjNTB4bHJzenVzemlmaXN5bjFqYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l4FGI8GoTL7N4DsyI/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWlkdDF5YzgxOTA3NTFqcjkxbWc4dXFvN3V5cGxkNzF0Y2Zsc3o3ZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0MYGYzk5wXCFnQ76/giphy.gif'
];

/**
 * Check if a GIF/image URL is accessible and returns valid content
 * Uses HEAD request with timeout to verify the resource exists
 */
async function isGifAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HabitSystemBot/1.0)'
      }
    });

    clearTimeout(timeoutId);

    // Check if response is successful (2xx status) and content type is image/gif
    const contentType = response.headers.get('content-type') || '';
    const isValid = response.ok && (
      contentType.includes('image/gif') ||
      contentType.includes('image/') ||
      url.includes('.gif')
    );

    if (!isValid) {
      console.log(`⚠️ GIF validation failed for ${url}: Status ${response.status}, Content-Type: ${contentType}`);
    }

    return isValid;
  } catch (error) {
    // Network errors, timeouts, or invalid URLs
    console.log(`⚠️ GIF validation error for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Get a random celebration GIF that is verified to be accessible
 * Tries multiple GIFs until finding one that works, or returns empty string if none work
 */
async function getRandomCelebrationGif(): Promise<string> {
  if (!CELEBRATION_GIFS.length) {
    return '';
  }

  // Shuffle the array to try GIFs in random order
  const shuffled = [...CELEBRATION_GIFS].sort(() => Math.random() - 0.5);

  // Try each GIF until we find one that's accessible
  for (const gifUrl of shuffled) {
    const isAccessible = await isGifAccessible(gifUrl);
    if (isAccessible) {
      console.log(`✅ Found accessible celebration GIF: ${gifUrl}`);
      return gifUrl;
    }
  }

  // If no GIFs are accessible, log warning and return empty string
  console.warn('⚠️ No accessible celebration GIFs found. Sending message without GIF.');
  return '';
}

/**
 * Run comprehensive tests
 */
async function runTests() {
  console.log('🧪 Testing GIF Validation Functionality\n');
  console.log('=' .repeat(60));

  // Test 1: Check each GIF individually
  console.log('\n📋 Test 1: Checking individual GIF URLs...\n');
  const results: Array<{ url: string; accessible: boolean; status?: number; contentType?: string }> = [];

  for (const gifUrl of CELEBRATION_GIFS) {
    console.log(`Testing: ${gifUrl.substring(0, 60)}...`);
    const accessible = await isGifAccessible(gifUrl);
    results.push({ url: gifUrl, accessible });
    
    if (accessible) {
      console.log(`  ✅ Accessible\n`);
    } else {
      console.log(`  ❌ Not accessible\n`);
    }
  }

  // Test 2: Test the getRandomCelebrationGif function
  console.log('\n📋 Test 2: Testing getRandomCelebrationGif() function...\n');
  const foundGif = await getRandomCelebrationGif();
  
  if (foundGif) {
    console.log(`✅ Successfully found accessible GIF: ${foundGif.substring(0, 60)}...\n`);
  } else {
    console.log(`⚠️ No accessible GIF found (fallback behavior working)\n`);
  }

  // Test 3: Test with invalid URL
  console.log('\n📋 Test 3: Testing with invalid URL...\n');
  const invalidUrl = 'https://invalid-url-that-does-not-exist-12345.com/image.gif';
  const invalidResult = await isGifAccessible(invalidUrl);
  console.log(`Invalid URL test: ${invalidResult ? '❌ Should have failed' : '✅ Correctly rejected invalid URL'}\n`);

  // Summary
  console.log('=' .repeat(60));
  console.log('\n📊 Test Summary:\n');
  const accessibleCount = results.filter(r => r.accessible).length;
  const totalCount = results.length;
  
  console.log(`Total GIFs tested: ${totalCount}`);
  console.log(`Accessible GIFs: ${accessibleCount}`);
  console.log(`Inaccessible GIFs: ${totalCount - accessibleCount}`);
  console.log(`Success rate: ${((accessibleCount / totalCount) * 100).toFixed(1)}%`);
  
  if (foundGif) {
    console.log(`\n✅ GIF validation is working correctly!`);
    console.log(`   The system will use accessible GIFs when available.`);
  } else if (accessibleCount === 0) {
    console.log(`\n⚠️ All GIFs are currently inaccessible.`);
    console.log(`   The fallback mechanism is working (no GIF will be sent).`);
  } else {
    console.log(`\n✅ GIF validation is working correctly!`);
    console.log(`   The system found ${accessibleCount} accessible GIF(s).`);
  }

  return {
    total: totalCount,
    accessible: accessibleCount,
    foundGif: !!foundGif
  };
}

// Run tests
if (require.main === module) {
  runTests()
    .then((results) => {
      console.log('\n✅ All tests completed!');
      process.exit(results.accessible > 0 || results.foundGif ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { runTests, isGifAccessible, getRandomCelebrationGif };
