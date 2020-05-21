
<p align="center">
  <a href="https://github.com/farmersdog/clubhouse-workflow-action/actions"><img alt="javscript-action status" src="https://github.com/farmersdog/clubhouse-workflow-action/workflows/unit%20tests/badge.svg"></a>
</p>

# Clubhouse Workflow Action

A github action to update and transition the workflow state of clubhouse stories.

**NOTE:** This action is a work in progress and pending initial release.

## Usage

Currently the action supports updating stories listed in a github release.

### Releases

```yaml
name: Release Stories
on:
  release:
    types: ['released']

jobs:
  update-clubhouse:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/clubhouse-workflow@v0.1
      with:
        # Required
        clubhouseToken: ${secrets.CLUBHOUSE_TOKEN}
        # The workflow state released stories should be in. The default is 'Completed'.
        endStateName: Completed
        # Whether to update story descriptions with link to the release.
        # The default is false.
        addReleaseInfo: false
```
