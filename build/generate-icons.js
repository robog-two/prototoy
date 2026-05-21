#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'prototoy-logo.svg');
const buildDir = path.join(projectRoot, 'build');
const iconDir = path.join(buildDir, 'icon');
const pngPath = path.join(buildDir, 'icon.png');

async function generateIcons() {
  try {
    console.log('📦 Generating app icons from SVG...');

    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }

    // Convert SVG to base PNG (1024x1024)
    console.log('🎨 Converting SVG to PNG (1024x1024)...');
    const pngBuffer = await sharp(svgPath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    fs.writeFileSync(pngPath, pngBuffer);
    console.log('✅ Base PNG created');

    // Generate icon.png (512x512 for app icon)
    console.log('🖼️  Generating app icon sizes...');
    const sizes = {
      'icon.png': 512,           // Main app icon
      'icon-16x16.png': 16,      // Linux, tray
      'icon-24x24.png': 24,      // Linux
      'icon-32x32.png': 32,      // Linux, Windows
      'icon-48x48.png': 48,      // Linux
      'icon-64x64.png': 64,      // Linux
      'icon-128x128.png': 128,   // Linux
      'icon-256x256.png': 256,   // Linux, macOS
      'icon-512x512.png': 512    // Linux, macOS
    };

    for (const [filename, size] of Object.entries(sizes)) {
      await sharp(pngBuffer)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .png()
        .toFile(path.join(iconDir, filename));
    }
    console.log(`✅ Generated ${Object.keys(sizes).length} PNG icon variants`);

    console.log('\n✅ Icons generated in', iconDir);
    console.log('📋 Generated files:');

    const files = fs.readdirSync(iconDir).sort();
    files.forEach(file => {
      const filePath = path.join(iconDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   📄 ${file} (${sizeKB} KB)`);
    });

    console.log('\n✨ Icon generation complete!');
    console.log('\n💡 Tip: electron-builder will use these PNG files to generate');
    console.log('   platform-specific icons (.ico for Windows, .icns for macOS)');
    console.log('   You can configure this in electron-builder.yml');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
