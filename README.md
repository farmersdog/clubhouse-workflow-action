
<p align="center">
  <a href="https://github.com/farmersdog/clubhouse-workflow-action/actions"><img alt="javscript-action status" src="https://github.com/farmersdog/clubhouse-workflow-action/workflows/unit%20tests/badge.svg"></a>
  <a href="https://github.com/farmersdog/clubhouse-action-test/actions?query=workflow%3A%22clubhouse+workflow+e2e+test%22"><img alt="javscript-action status" src="https://github.com/farmersdog/clubhouse-action-test/workflows/clubhouse%20workflow%20e2e%20test/badge.svg"></a>
</p>

# Clubhouse Workflow Action

A github action to update and transition the workflow state of clubhouse stories.

## Usage

Currently the action supports updating stories listed in a github release.

### Releases

While `released` is shown below, the action can be configured to run in response to any of the valid release [action types](https://developer.github.com/webhooks/event-payloads/#webhook-payload-object-34) that makes sense for your workflow.

```yaml
name: Release Stories
on:
  release:
    types: ['released']

jobs:
  update-clubhouse:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/clubhouse-workflow@v1
      with:
        # Required.
        clubhouseToken: ${{ secrets.CLUBHOUSE_TOKEN }}
        # Optional. The workflow state released stories should be in.
        # default: 'Completed'.
        endStateName: Completed
        # Optional. Whether to update story descriptions with a link to the release.
        # default: false.
        addReleaseInfo: false
```

The only requirement for identifying stories in a release is that the id is prepended with `ch`. Any surrounding brackets, or no brackets, will all work.

For example, if the below block is the release body the first three will be extracted, and the last one will not.

```markdown
### Features

ch1234 Shiny New Thing
[ch9876] Bug In Disguise

### Bugs

(ch5432) Some color was off
[1928]  Lost $$$$
```

If `addReleaseInfo: true` is set the action will update the story with a link back to the release like shown below.
```markdown
### Release Info
https://github.com/org/repo/releases/tag/v1.0.0
```
The action will only add `### Release Info` to a story if it's not already present. In some case a story is released more than once it will have a link to the first release.
