const { execSync } = require('child_process');
const fs = require('fs');

function generate() {
  const since = process.argv[2] || 'HEAD~20';
  const format = '%h %s (%an)';
  try {
    const log = execSync(`git log --pretty=format:"${format}" ${since}..HEAD`).toString();
    const header = `# Changelog\n\nGenerated on ${new Date().toISOString()}\n\n`;
    const body = log.split('\n').map(l => `- ${l}`).join('\n');
    fs.writeFileSync('CHANGELOG.md', header + body + '\n');
    console.log('CHANGELOG.md generated');
  } catch (e) {
    console.error('Failed to generate changelog', e.message);
    process.exit(1);
  }
}

generate();
