const github = require('@actions/github');
const core = require('@actions/core');

const ch = require('src/clubhouse');

async function run() {
  try {
    const { body: releaseBody, html_url: releaseUrl } = github.context.event;
    const addReleaseInfo = (core.getInput('addReleaseInfo') === 'true');
    const clubhouseToken = core.getInput('clubhouseToken');
    core.setSecret(clubhouseToken);
    process.env.CLUBHOUSE_TOKEN = clubhouseToken;
    const releasedStories = ch.releaseStories(
      releaseBody,
      core.getInput('endStateName'),
      releaseUrl,
      addReleaseInfo
    );
    core.setOutput(releasedStories);
    console.log(`Updated Stories: \n \n${releasedStories.join(' ')}`);
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
