const github = require('@actions/github');
const core = require('@actions/core');

const ch = require('./src/clubhouse');

async function run() {
  try {
    const { body, html_url } = github.context.payload.release;
    const addReleaseInfo = (core.getInput('addReleaseInfo') === 'true');
    const releasedStories = await ch.releaseStories(
      body,
      core.getInput('endStateName'),
      html_url,
      addReleaseInfo
    );
    core.setOutput(releasedStories);
    console.log(`Updated Stories: \n \n${releasedStories.join(' \n')}`);
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
