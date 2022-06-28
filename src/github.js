const props = require('../data/props.json');
const { Octokit } = require('@octokit/rest');

const compare = require('./duplicates');

module.exports = class Github {

    constructor() {
        this.api = new Octokit({
            auth: props.GITHUB_TOKEN,
        }).rest;
    }

    getIssues() {
        return new Promise(async(resolve, reject) => {
            try {
                let issues = await this.api.issues.listForRepo({
                    owner: 'darkan-report-bot',
                    repo: 'test-repo',
                });
                resolve(issues.data);
            } catch (error) {
                reject(error);
            }
        });
    }

    async createIssue(title, body) {
        try {
            let issue = await this.api.issues.create({
                owner: 'darkan-report-bot',
                repo: 'test-repo',
                title,
                body
            });
            return issue.data;
        } catch (error) {
            console.log(error);
        }
    }

    async searchForDuplicates(title) {
        let issues = await this.getIssues();
        let duplicates = [];
        for (let issue of issues) {
            let accuracy = compare(title, issue.title);
            if (accuracy >= props.THRESHOLD) {
                duplicates.push({
                    title: issue.title,
                    url: issue.html_url,
                });
            }
        }
        return duplicates.slice(0, 5);
    }

}