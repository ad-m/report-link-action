# Report-link-action

Action that reports incorrect links as new issue. Thanks to this, it facilitates keeping documentation constantly in good condition.

## Usage

### Example Workflow file

An example workflow to authenticate with GitHub Platform:

```yaml
on:
  branches:
    - master

schedule:
# Run at 12:00 in working days
  - cron: 0 12 * * 0-5

jobs:
  build:
    name: Validate links
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: Validate links
      uses: ad-m/report-link-action@master
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| name | value | default | description |
| ---- | ----- | ------- | ----------- |
| github_token | string | | Token for the repo. Can be passed in using `${{ secrets.GITHUB_TOKEN }}`. |

PR is welcome to add additional parameters to the needs of the user eg. customize directory, labels, content, title, format (RST etc.).

## License

The Dockerfile and associated scripts and documentation in this project are released under the [MIT License](LICENSE).

## No affiliation with GitHub Inc.

GitHub are registered trademarks of GitHub, Inc. GitHub name used in this project are for identification purposes only. The project is not associated in any way with GitHub Inc. and is not an official solution of GitHub Inc. It was made available in order to facilitate the use of the site GitHub.
