const github = require('@actions/github');
const core = require('@actions/core');

const ch = require('./src/clubhouse');

async function run() {
  try {
    const { payload, eventName } = github.context;
    let updatedStories;
    if (eventName === "release") {
      const { body, html_url } = payload.release;
      const addReleaseInfo = (core.getInput('addReleaseInfo') === 'true');
      updatedStories = await ch.releaseStories(
        body,
        core.getInput('endStateName'),
        html_url,
        addReleaseInfo
      );
    } else if (eventName === "pull_request") {
      const { title, body } = payload.pull_request;
      const { ref } = payload.pull_request.head;
      const content = `${title} ${body} ${ref}`;
      updatedStories = await ch.transitionStories(
        content,
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
