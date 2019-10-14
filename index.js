const core = require('@actions/core');
const github = require('@actions/github');
const markdownLinkCheck = require('markdown-link-check');
const fs = require('fs').promises;
const klaw = require('klaw');
const util = require('util');
const markdownLinkCheckPromised = util.promisify(markdownLinkCheck);

const getBody = (errors) => {
}

const main = async () => {
    const errors = [];

    const octokit = new github.GitHub(core.getInput('github_token'));

    for await (const item of klaw('README.md')) {
        if (item.stats.isDirectory()) {
            continue;
        }
        if (!item.path.toLowerCase().endsWith('.md')) {
            continue;
        }
        const content = await fs.readFile(item.path, { encoding: 'utf-8' });
        console.log("Processing file", item.path);
        const results = await markdownLinkCheckPromised(content, {
            ignorePatterns: [
                { pattern: new RegExp("^(?!https{0,1}://).*$") }
            ],
        });

        results.forEach((result) => {
            if (result.status === 'dead') {
                core.error(`'${result.link}' in '${item.path}' is ${result.status}:`, result.err);
                errors.push({ result, path });
            } else {
                core.debug(`'${result.link}' in '${item.path}' is ${result.status}`)
            }
        });
    }

    if (errors.length === 0) {
        return;
    };

    const context = github.context;
    let { data: issues } = await octokit.issues.listForRepo({
        ...context,
        state: 'open',
        labels: ['report-link']
    });
    issues = issues.filter(x => x.title === 'Broken link found!');

    if (issues.length == 0) {
        const { data: newIssue } = await octokit.issues.create({
            ...context.repo,
            labels: ['report-link'],
            title: 'Broken link found!',
            body: getBody(errors),
        });
        console.log({ newIssue });
    } else {
        const { data: updatedIssue } = await octokit.issues.update({
            owner,
            repo,
            title: 'Broken link found!',
            body: getBody(errors),
            issue_number: issues[0].issue_number
        });
        console.log({ updatedIssue });
    }

}

if (require.main === module) {
    main().catch(err => {
        console.log(err);
        core.setFailed(err.message);
    })
}

module.exports = main;
