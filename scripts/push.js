const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

const dir = '/Users/mamtayadav/Downloads/shreekarnirealestate';
const token = process.argv[2] || process.env.GITHUB_TOKEN;

if (!token) {
  console.error('\n❌ Please provide your GitHub Personal Access Token:');
  console.error('Usage: npm run push <YOUR_GITHUB_TOKEN>');
  console.error('or: GITHUB_TOKEN=ghp_xxx npm run push\n');
  process.exit(1);
}

async function main() {
  console.log('🚀 Pushing to https://github.com/sandeepcharan619-maker/Shree-Karni ...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({
        username: token,
        password: '',
      }),
    });
    console.log('✅ Successfully pushed to GitHub!');
    console.log(pushResult);
  } catch (err) {
    console.error('❌ Push failed:', err.message);
  }
}

main();
