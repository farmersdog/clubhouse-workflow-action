#!/usr/bin/env node

const fs = require('fs');
const argv = require('yargs').argv;

const ch = require('../src/clubhouse');

const help = `

    Basic Usage:

    node scripts/releaseStories.js \\
        --release_path /path/to/release.txt \\
    ;
`;

async function releaseStories(argv) {
    const { release_path: releasePath, end_state: optEndState } = argv;
    if ( releasePath === undefined ) {
        throw new Error(help);
    }
    const endState = optEndState !== undefined ? optEndState : 'Completed';
    const releaseBody = fs.readFileSync(releasePath, {encoding: 'utf8'});
    const storyNames = await ch.releaseStories(releaseBody, endState, '', false);
    console.log(storyNames.join(' '));
}

function exit(err) {
    console.error(err);
    process.exit(1);
}

async function main() {
    try {
        await releaseStories(argv);
    } catch (err) {
        exit(err);
    }
}

if (require.main === module) {
    main();
}
