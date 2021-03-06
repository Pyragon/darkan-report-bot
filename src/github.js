const props = require('../data/props.json');
const { Octokit } = require('@octokit/rest');

const compare = require('./duplicates');

module.exports = class Github {

    constructor() {
        this.api = new Octokit({
            auth: props.GITHUB_TOKEN,
        }).rest;
    }

    async getIssues() {
        try {
            let issues = await this.api.issues.listForRepo({
                owner: 'DarkanRS',
                repo: 'world-server',
            });
            return issues.data;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async createIssue(title, body) {
        try {
            let issue = await this.api.issues.create({
                owner: 'DarkanRS',
                repo: 'world-server',
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