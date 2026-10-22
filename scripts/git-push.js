const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

const dir = '/Users/mamtayadav/Downloads/shreekarnirealestate';

async function main() {
  console.log('Attempting push to origin/main...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      onAuth: () => {
        console.log('Authentication requested by GitHub');
        return { username: 'sandeepcharan619-maker' };
      },
    });
    console.log('Push result:', pushResult);
  } catch (err) {
    console.error('Push error:', err.message);
  }
}

main();
