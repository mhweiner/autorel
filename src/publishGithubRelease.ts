import {getRepo} from './services/git';
import {createRelease} from './services/github';

export function publishGithubRelease(
    tag: string,
    changelog: string,
): void {

    const {owner, repository} = getRepo();

    createRelease({
        token: process.env.GITHUB_TOKEN!,
        owner,
        repository,
        tag,
        name: tag,
        body: changelog,
    });

}
