const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const envPath = path.join(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `EXPO_PUBLIC_GIT_BRANCH=${branch}\n`);
    return;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('EXPO_PUBLIC_GIT_BRANCH=')) {
    content = content.replace(/EXPO_PUBLIC_GIT_BRANCH=.*/, `EXPO_PUBLIC_GIT_BRANCH=${branch}`);
  } else {
    content += `\nEXPO_PUBLIC_GIT_BRANCH=${branch}\n`;
  }

  fs.writeFileSync(envPath, content);
  console.log(`Updated EXPO_PUBLIC_GIT_BRANCH to ${branch}`);
} catch (error) {
  console.error('Failed to update branch name:', error.message);
}
