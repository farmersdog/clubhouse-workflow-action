const github = require("@actions/github");
const core = require("@actions/core");

const ch = require("./src/clubhouse");

async function run() {
  try {
    const { payload, eventName } = github.context;
    const updatedStories = await ch.actionManager(payload, eventName);
    core.setOutput("updatedStories", JSON.stringify(updatedStories));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
