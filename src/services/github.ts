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

    const {name, body, draft = false, prerelease = false} = params;
    const postData = JSON.stringify({
        tag_name: params.tag,
        name,
        body,
        draft,
        prerelease,
    });
    const url = `https://api.github.com/repos/${params.owner}/${params.repository}/releases`;
    const options = {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${params.token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'autorel (https://npmjs.com/autorel)',
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

    const url = `https://api.github.com/repos/${params.owner}/${params.repository}/releases/${params.releaseId}`;
    const options = {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${params.token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'autorel (https://npmjs.com/autorel)',
        },
    };

    await httpRequest('DELETE', url, '', options);

}
