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
    const { release_path, end_state, add_release_info, release_url } = argv;
    if ( release_path === undefined ) {
        throw new Error(help);
    }
    if ( add_release_info !== undefined && release_url === undefined ) {
        throw new Error('When adding release info, "release_url" must be set');
    }
    const endState = end_state !== undefined ? end_state : 'Completed';
    const addReleaseInfo = add_release_info !== undefined ? true : false;
    const releaseUrl = release_url !== undefined ? release_url : '';
    const releaseBody = fs.readFileSync(release_path, {encoding: 'utf8'});
    const storyNames = await ch.releaseStories(
        releaseBody,
        endState,
        releaseUrl,
        addReleaseInfo
    );
    console.log(`Updated Stories: \n \n${storyNames.join(' \n')}`);
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
