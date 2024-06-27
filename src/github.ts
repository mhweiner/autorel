import {httpRequest} from './lib/httpRequest';

interface CreateReleaseParams {
    owner: string
    repository: string
    tagName: string
    releaseName: string
    body: string
    draft?: boolean
    prerelease?: boolean
}

/**
 * Creates a release on GitHub.
 * @param token The GitHub personal access token.
 * @param params The parameters for creating the release.
 */
// eslint-disable-next-line max-lines-per-function
export function createRelease(token: string, params: CreateReleaseParams): Promise<string> {

    const {owner, repository, tagName, releaseName, body, draft = false, prerelease = false} = params;

    const postData = JSON.stringify({
        tag_name: tagName,
        name: releaseName,
        body,
        draft,
        prerelease,
    });

    const url = `https://api.github.com/repos/${owner}/${repository}/releases`;
    const options = {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'mhweiner',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    };

    return httpRequest('POST', url, postData, options);

}
