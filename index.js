const github = require('@actions/github');
const core = require('@actions/core');

const ch = require('./src/clubhouse');

async function run() {
  try {
    let updatedStories;
    if (github.context.eventName === "release") {
      const { body, html_url } = github.context.payload.release;
      const addReleaseInfo = (core.getInput('addReleaseInfo') === 'true');
      updatedStories = await ch.releaseStories(
        body,
        core.getInput('endStateName'),
        html_url,
        addReleaseInfo
      );
    } else if (github.context.eventName === "pull_request") {
      const { title } = github.context.payload.pull_request;
      updatedStories = await ch.transitionStories(
        title,
        core.getInput('endStateName')
      );
    } else {
      throw new Error("Invalid event type");
    }
    core.setOutput(updatedStories);
    console.log(`Updated Stories: \n \n${updatedStories.join(' \n')}`);
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
