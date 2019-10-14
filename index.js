const core = require('@actions/core');
const github = require('@actions/github');
const markdownLinkCheck = require('markdown-link-check');
const fs = require('fs').promises;
const klaw = require('klaw');
const util = require('util');
const markdownLinkCheckPromised = util.promisify(markdownLinkCheck);

const quote = '```';

const getBody = (errors) => {
    const items = errors.map(({ result, item }) => `- [ ] ${quote}${result.link}${quote} in ${quote}${item.path}${quote}`);
    const lines = [
        `Hello!`,
        `Found following broken links:`,
        '',
        ...items,
        '',
        `Hope you will able to fix it soon!`,
        `Greetings,`,
        `Report-link-action-bot!`
    ];
    return lines.join("\n");
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
                errors.push({ result, item });
            } else {
                core.debug(`'${result.link}' in '${item.path}' is ${result.status}`)
            }
        });
    }

    const context = github.context;
    let { data: issues } = await octokit.issues.listForRepo({
        ...context.repo,
        state: 'open',
        labels: ['report-link']
    });

    issues = issues.filter(x => x.title === 'Broken link found!');
    body = getBody(errors);

    if (errors.length === 0 && issues.length > 0) {
        const { data: updatedIssue } = await octokit.issues.update({
            ...context.repo,
            state: 'closed',
            issue_number: issues[0].number
        });
        console.log("Issue closed:", updatedIssue.html_url);
        return;
    } else if (errors.length > 0 && issues.length == 0) {
        const { data: newIssue } = await octokit.issues.create({
            ...context.repo,
            labels: ['report-link'],
            title: 'Broken link found!',
            body,
        });
        console.log("New issue created:", newIssue.html_url);
    } else if (errors.length > 0 && issues[0].body !== body) {
        const { data: updatedIssue } = await octokit.issues.update({
            ...context.repo,
            issue_number: issues[0].number,
            body,
        });
        console.log("Issue updated:", updatedIssue.html_url);
    } else {
        console.log("Nothing to do!");
    }
}

if (require.main === module) {
    main().catch(err => {
        console.log(err);
        core.setFailed(err.message);
    })
}

module.exports = main;
