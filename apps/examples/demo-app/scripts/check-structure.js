#!/usr/bin/env node

/**
 * Structure validation script for Performer Framework
 * Ensures proper project structure and prevents conflicts
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function checkStructure() {
  console.log('🔍 Checking project structure...');

  const errors = [];

  // Check for conflicting directory structures
  const hasSrc = fs.existsSync(path.join(projectRoot, 'src'));
  const hasApp = fs.existsSync(path.join(projectRoot, 'app'));

  if (hasSrc && hasApp) {
    errors.push('❌ ERROR: Both "src/" and "app/" directories exist!');
    errors.push('   This creates confusion between Vite (src/) and Next.js (app/) structures.');
    errors.push('   Please use only "src/" for Vite + React projects.');
    errors.push('   Remove the "app/" directory to continue.');
  }

  // Check for required directories
  const requiredDirs = ['src', 'src/components', 'src/pages', 'src/processes'];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(path.join(projectRoot, dir))) {
      errors.push(`❌ ERROR: Required directory "${dir}/" is missing!`);
    }
  }

  // Check for proper file organization
  const srcFiles = fs.readdirSync(path.join(projectRoot, 'src'), { withFileTypes: true });
  const hasMainTsx = srcFiles.some(file => file.name === 'main.tsx');
  const hasAppTsx = srcFiles.some(file => file.name === 'App.tsx');

  if (!hasMainTsx) {
    errors.push('❌ ERROR: "src/main.tsx" (React entry point) is missing!');
  }

  if (!hasAppTsx) {
    errors.push('❌ ERROR: "src/App.tsx" (main App component) is missing!');
  }

  // Helper function to check if directory contains .tsx files recursively
  function checkDirectoryForTsxFiles(dirPath) {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        if (item.isFile() && item.name.endsWith('.tsx')) {
          return true;
        } else if (item.isDirectory()) {
          if (checkDirectoryForTsxFiles(itemPath)) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Check for proper page structure
  const pagesDir = path.join(projectRoot, 'src/pages');
  if (fs.existsSync(pagesDir)) {
    const pageDirs = fs.readdirSync(pagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (pageDirs.length === 0) {
      errors.push('⚠️  WARNING: No page directories found in src/pages/');
    }

    // Check each page directory has proper structure
    for (const pageDir of pageDirs) {
      const pagePath = path.join(pagesDir, pageDir);

      if (!checkDirectoryForTsxFiles(pagePath)) {
        errors.push(`❌ ERROR: Page directory "${pageDir}" has no .tsx files!`);
      }
    }
  }

  // Check for proper process definitions
  const processesDir = path.join(projectRoot, 'src/processes');
  if (fs.existsSync(processesDir)) {
    const processFiles = fs.readdirSync(processesDir)
      .filter(file => file.endsWith('.ts'));

    if (processFiles.length === 0) {
      errors.push('⚠️  WARNING: No process definition files found in src/processes/');
    }
  }

  // Check for server-side code organization
  const serverDir = path.join(projectRoot, 'src/server');
  if (fs.existsSync(serverDir)) {
    const serverDirs = fs.readdirSync(serverDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const serverSubDir of serverDirs) {
      const subDirPath = path.join(serverDir, serverSubDir);
      const files = fs.readdirSync(subDirPath);

      const hasActions = files.some(file => file.includes('action'));
      const hasLoader = files.some(file => file.includes('loader'));

      if (!hasActions && !hasLoader) {
        errors.push(`⚠️  WARNING: Server directory "${serverSubDir}" has no actions or loaders`);
      }
    }
  }

  // Report results
  if (errors.length === 0) {
    console.log('✅ Project structure is valid!');
    console.log('📁 Structure summary:');
    console.log(`   - src/: ${hasSrc ? '✅' : '❌'} (Vite source directory)`);
    console.log(`   - app/: ${hasApp ? '❌ (should be removed)' : '✅ (not present)'}`);
    console.log(`   - src/components/: ${fs.existsSync(path.join(projectRoot, 'src/components')) ? '✅' : '❌'}`);
    console.log(`   - src/pages/: ${fs.existsSync(path.join(projectRoot, 'src/pages')) ? '✅' : '❌'}`);
    console.log(`   - src/processes/: ${fs.existsSync(path.join(projectRoot, 'src/processes')) ? '✅' : '❌'}`);
    console.log(`   - src/server/: ${fs.existsSync(path.join(projectRoot, 'src/server')) ? '✅' : '❌'}`);
    console.log('');
    console.log('🎉 Ready to build!');
    process.exit(0);
  } else {
    console.log('❌ Structure validation failed!');
    console.log('');
    errors.forEach(error => console.log(error));
    console.log('');
    console.log('🔧 Fix the above issues before building.');
    console.log('💡 For help, check the project documentation.');
    process.exit(1);
  }
}

// Run the check
try {
  checkStructure();
} catch (error) {
  console.error('❌ Error during structure check:', error.message);
  process.exit(1);
}
