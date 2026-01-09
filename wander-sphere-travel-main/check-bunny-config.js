/**
 * Bunny.net Configuration Checker
 * 
 * Run this in your browser console (F12) on your app to diagnose image loading issues
 * 
 * Usage:
 * 1. Open your app in the browser
 * 2. Press F12 to open DevTools
 * 3. Go to Console tab
 * 4. Copy and paste this entire file
 * 5. Press Enter
 */

(function() {
    console.clear();
    console.log('%c🔍 Bunny.net Configuration Diagnostic', 'font-size: 20px; font-weight: bold; color: #667eea;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
    console.log('\n');

    // Expected values
    const EXPECTED = {
        PULL_ZONE_URL: 'https://nomad-app-media.b-cdn.net',
        HOSTNAME: 'sg.storage.bunnycdn.com',
        STORAGE_NAME: 'nomad-app-media',
        REGION: 'sg'
    };

    // Get actual values from environment
    const actual = {
        PULL_ZONE_URL: import.meta?.env?.VITE_BUNNY_PULL_ZONE_URL || 'undefined',
        HOSTNAME: import.meta?.env?.VITE_BUNNY_HOSTNAME || 'undefined',
        STORAGE_NAME: import.meta?.env?.VITE_BUNNY_STORAGE_NAME || 'undefined',
        REGION: import.meta?.env?.VITE_BUNNY_REGION || 'undefined',
        API_KEY_SET: import.meta?.env?.VITE_BUNNY_API_KEY ? '✅ Set' : '❌ Missing'
    };

    console.log('%c📋 Environment Variables Check:', 'font-size: 16px; font-weight: bold; color: #333;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check each variable
    let hasIssues = false;

    Object.keys(EXPECTED).forEach(key => {
        const actualValue = actual[key];
        const expectedValue = EXPECTED[key];
        const matches = actualValue === expectedValue;

        if (!matches) hasIssues = true;

        const icon = matches ? '✅' : '❌';
        const color = matches ? 'color: green;' : 'color: red;';
        
        console.log(`%c${icon} VITE_BUNNY_${key}`, color + 'font-weight: bold;');
        console.log(`   Expected: ${expectedValue}`);
        console.log(`   Actual:   ${actualValue}`);
        console.log('');
    });

    console.log(`%c🔑 VITE_BUNNY_API_KEY: ${actual.API_KEY_SET}`, 'font-weight: bold;');
    console.log('\n');

    // Overall status
    if (!hasIssues) {
        console.log('%c✅ ALL CONFIGURATION CHECKS PASSED!', 'font-size: 18px; font-weight: bold; color: green; background: #d4edda; padding: 10px;');
        console.log('\n');
        console.log('%c📍 Next: Check Your Database URLs', 'font-size: 16px; font-weight: bold; color: #333;');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('1. Go to Supabase Dashboard → Table Editor');
        console.log('2. Check "posts" or "stories" table');
        console.log('3. Look at the "media_url" or "images" column');
        console.log('4. URLs should start with: ' + EXPECTED.PULL_ZONE_URL);
        console.log('\n');
    } else {
        console.log('%c❌ CONFIGURATION ISSUES FOUND', 'font-size: 18px; font-weight: bold; color: red; background: #f8d7da; padding: 10px;');
        console.log('\n');
        console.log('%c🔧 How to Fix:', 'font-size: 16px; font-weight: bold; color: #333;');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('1. Open your .env file in the project root');
        console.log('2. Add or update these lines:\n');
        console.log('%c   VITE_BUNNY_PULL_ZONE_URL=' + EXPECTED.PULL_ZONE_URL, 'background: #f0f0f0; padding: 5px; font-family: monospace;');
        console.log('%c   VITE_BUNNY_HOSTNAME=' + EXPECTED.HOSTNAME, 'background: #f0f0f0; padding: 5px; font-family: monospace;');
        console.log('%c   VITE_BUNNY_STORAGE_NAME=' + EXPECTED.STORAGE_NAME, 'background: #f0f0f0; padding: 5px; font-family: monospace;');
        console.log('\n3. Restart your development server:');
        console.log('%c   npm run dev', 'background: #f0f0f0; padding: 5px; font-family: monospace;');
        console.log('\n4. Reload this page and run this checker again\n');
    }

    // Provide helper function to test URLs
    console.log('%c🧪 Helper Functions Available:', 'font-size: 16px; font-weight: bold; color: #333;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('To test a specific image URL, run:');
    console.log('%c   testBunnyImage("posts/images/1234567_abc.jpg")', 'background: #f0f0f0; padding: 5px; font-family: monospace;');
    console.log('\nTo check what URL will be generated:');
    console.log('%c   getBunnyUrl("posts/images/1234567_abc.jpg")', 'background: #f0f0f0; padding: 5px; font-family: monospace;');
    console.log('\n');

    // Add helper functions to window
    window.getBunnyUrl = function(storagePath) {
        const url = `${actual.PULL_ZONE_URL}/${storagePath}`;
        console.log('%c📍 Generated URL:', 'font-weight: bold;');
        console.log(url);
        return url;
    };

    window.testBunnyImage = function(storagePath) {
        const url = `${actual.PULL_ZONE_URL}/${storagePath}`;
        console.log('%c🧪 Testing Image:', 'font-weight: bold;');
        console.log('URL: ' + url);
        console.log('Loading...\n');

        const img = new Image();
        img.onload = function() {
            console.log('%c✅ IMAGE LOADED SUCCESSFULLY!', 'font-size: 14px; font-weight: bold; color: green; background: #d4edda; padding: 5px;');
            console.log('Dimensions: ' + this.width + 'x' + this.height);
            console.log('URL: ' + url);
            console.log('\n%cImage preview:', 'font-weight: bold;');
            console.log(img);
        };
        img.onerror = function() {
            console.log('%c❌ IMAGE FAILED TO LOAD', 'font-size: 14px; font-weight: bold; color: red; background: #f8d7da; padding: 5px;');
            console.log('URL: ' + url);
            console.log('\n%cPossible causes:', 'font-weight: bold;');
            console.log('1. File does not exist in Bunny.net storage');
            console.log('2. Pull Zone is not connected to Storage Zone');
            console.log('3. Incorrect storage path');
            console.log('4. CDN cache not propagated yet (wait 1-2 min)');
        };
        img.src = url;
    };

    // Check if we can find any broken images on the page
    console.log('%c🔍 Scanning Page for Images:', 'font-size: 16px; font-weight: bold; color: #333;');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const images = document.querySelectorAll('img');
    const brokenImages = [];
    const bunnyImages = [];

    images.forEach((img, index) => {
        const src = img.src;
        
        // Check for storage URL (wrong)
        if (src.includes('storage.bunnycdn.com')) {
            brokenImages.push({
                index,
                src,
                reason: '❌ Using STORAGE URL instead of CDN URL',
                fix: src.replace(/https:\/\/[^\/]+\/nomad-app-media/, EXPECTED.PULL_ZONE_URL)
            });
        }
        // Check for undefined/localhost
        else if (src.includes('undefined') || (src.includes('localhost') && src.includes('posts'))) {
            brokenImages.push({
                index,
                src,
                reason: '❌ Environment variable not loaded',
                fix: 'Restart dev server and reload page'
            });
        }
        // Check for correct Bunny CDN URLs
        else if (src.includes('b-cdn.net')) {
            bunnyImages.push({
                index,
                src,
                loaded: img.complete && img.naturalHeight !== 0
            });
        }
    });

    if (brokenImages.length > 0) {
        console.log(`%c⚠️ Found ${brokenImages.length} potentially broken image(s):`, 'font-weight: bold; color: orange;');
        brokenImages.forEach((img, i) => {
            console.log(`\n%cImage ${i + 1}:`, 'font-weight: bold;');
            console.log('Current URL: ' + img.src);
            console.log('Issue: ' + img.reason);
            console.log('Fix: ' + img.fix);
        });
        console.log('\n');
    }

    if (bunnyImages.length > 0) {
        console.log(`%c✅ Found ${bunnyImages.length} image(s) with correct CDN URL:`, 'font-weight: bold; color: green;');
        const loaded = bunnyImages.filter(img => img.loaded).length;
        const failed = bunnyImages.length - loaded;
        console.log(`   Loaded: ${loaded}`);
        console.log(`   Failed: ${failed}`);
        
        if (failed > 0) {
            console.log('\n%c⚠️ Some images with correct URLs failed to load:', 'font-weight: bold; color: orange;');
            console.log('This might mean:');
            console.log('1. Files don\'t exist in Bunny.net storage');
            console.log('2. Pull Zone not connected to Storage Zone');
            console.log('3. CDN cache propagation delay');
        }
        console.log('\n');
    }

    if (brokenImages.length === 0 && bunnyImages.length === 0) {
        console.log('No Bunny.net images found on this page');
        console.log('Upload a new post/story to test the upload flow\n');
    }

    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
    console.log('%cDiagnostic Complete! 🎉', 'font-size: 16px; font-weight: bold; color: #667eea;');
    console.log('\n');
})();
