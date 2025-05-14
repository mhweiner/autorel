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

export async function createRelease(params: CreateReleaseParams): Promise<number> {

    const {
        token,
        owner,
        repository,
        tag,
        name,
        body,
        draft = false,
        prerelease = false,
    } = params;

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
            'X-GitHub-Api-Version': '2022-11-28',
        },
    };

    const responseText = await httpRequest('POST', url, postData, options);
    const response = JSON.parse(responseText);

    return response.id;

}

export async function deleteReleaseById(params: {
    token: string
    owner: string
    repository: string
    releaseId: number
}): Promise<void> {

    const {token, owner, repository, releaseId} = params;

    const url = `https://api.github.com/repos/${owner}/${repository}/releases/${releaseId}`;
    const options = {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
    };

    await httpRequest('DELETE', url, '', options);

}
