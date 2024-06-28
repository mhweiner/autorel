import {httpRequest} from '../lib/httpRequest';

interface CreateReleaseParams {
    token: string
    owner: string
    repository: string
    tag: string
    name: string
    body: string
    draft?: boolean
    prerelease?: boolean
}

export function createRelease(params: CreateReleaseParams): Promise<string> {

    const {token, owner, repository, tag, name, body, draft = false, prerelease = false} = params;

    const postData = JSON.stringify({
        tag_name: tag,
        name,
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
