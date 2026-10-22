const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

const dir = '/Users/mamtayadav/Downloads/shreekarnirealestate';

async function main() {
  console.log('Initializing git repository...');
  await git.init({ fs, dir, defaultBranch: 'main' });

  // Set remote
  await git.addRemote({
    fs,
    dir,
    remote: 'origin',
    url: 'https://github.com/sandeepcharan619-maker/Shree-Karni.git',
    force: true,
  });

  console.log('Finding files to add...');
  
  function getFiles(currentDir, baseDir = dir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(baseDir, fullPath);
      
      // Skip ignored folders/files
      if (
        entry.name === '.git' ||
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        relPath === 'dev.db' ||
        entry.name.endsWith('.db-journal') ||
        entry.name === '.DS_Store' ||
        entry.name === '.env'
      ) {
        continue;
      }
      
      if (entry.isDirectory()) {
        files = files.concat(getFiles(fullPath, baseDir));
      } else {
        files.push(relPath);
      }
    }
    return files;
  }

  const allFiles = getFiles(dir);
  console.log(`Adding ${allFiles.length} files...`);

  for (const file of allFiles) {
    await git.add({ fs, dir, filepath: file });
  }

  console.log('Creating initial commit...');
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'sandeepcharan619-maker',
      email: 'sandeepcharan619@gmail.com',
    },
    message: 'Initial commit: Shree Karni Real Estate platform with associate & admin dashboards',
  });

  console.log('Committed successfully! SHA:', sha);
}

main().catch(console.error);
