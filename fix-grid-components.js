const fs = require('fs');
const path = require('path');

// Function to fix Grid components in a file
function fixGridComponents(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix Grid components with item prop and md prop
    const gridItemRegex = /<Grid\s+item\s+xs={(\d+)}\s+md={(\d+)}/g;
    content = content.replace(gridItemRegex, (match, xs, md) => {
      modified = true;
      return `<Grid size={{ xs: ${xs}, md: ${md} }}`;
    });

    // Fix Grid components with item prop and other size props
    const gridItemWithSmRegex = /<Grid\s+item\s+xs={(\d+)}\s+sm={(\d+)}\s+md={(\d+)}/g;
    content = content.replace(gridItemWithSmRegex, (match, xs, sm, md) => {
      modified = true;
      return `<Grid size={{ xs: ${xs}, sm: ${sm}, md: ${md} }}`;
    });

    // Fix Grid components with item prop and lg prop
    const gridItemWithLgRegex = /<Grid\s+item\s+xs={(\d+)}\s+md={(\d+)}\s+lg={(\d+)}/g;
    content = content.replace(gridItemWithLgRegex, (match, xs, md, lg) => {
      modified = true;
      return `<Grid size={{ xs: ${xs}, md: ${md}, lg: ${lg} }}`;
    });

    // Fix Grid components with item prop and all size props
    const gridItemWithAllRegex = /<Grid\s+item\s+xs={(\d+)}\s+sm={(\d+)}\s+md={(\d+)}\s+lg={(\d+)}/g;
    content = content.replace(gridItemWithAllRegex, (match, xs, sm, md, lg) => {
      modified = true;
      return `<Grid size={{ xs: ${xs}, sm: ${sm}, md: ${md}, lg: ${lg} }}`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed Grid components in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and fix all JS files
function fixAllGridComponents(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      fixedCount += fixAllGridComponents(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      if (fixGridComponents(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

// Fix Grid components in the Frontend/src directory
const frontendSrcPath = path.join(__dirname, 'Frontend', 'src');
console.log('Fixing Grid components in Frontend/src...');
const fixedCount = fixAllGridComponents(frontendSrcPath);
console.log(`Fixed Grid components in ${fixedCount} files.`);
