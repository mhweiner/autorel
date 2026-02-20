import {httpRequest} from '../lib/httpRequest';

const DEFAULT_HEADERS = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'autorel (https://npmjs.com/autorel)',
};

function authHeaders(token: string) {

    return {
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${token}`,
    };

}

/** GET /repos/{owner}/{repo}/releases/tags/{tag}. Returns the release or null if 404. */
export async function getReleaseByTag(params: {
    token: string
    owner: string
    repository: string
    tag: string
}): Promise<{ id: number } | null> {

    const url = `https://api.github.com/repos/${params.owner}/${params.repository}/releases/tags/${params.tag}`;
    const options = {
        headers: authHeaders(params.token),
    };

    try {

        const responseText = await httpRequest('GET', url, undefined, options);
        const response = JSON.parse(responseText);

        return {id: response.id};

    } catch (err: unknown) {

        const status = (err as { status?: number }).status;

        if (status === 404) return null;
        throw err;

    }

}

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

    const {name, body, prerelease = false} = params;
    const postData = JSON.stringify({
        tag_name: params.tag,
        name,
        body,
        draft: false,
        prerelease,
    });
    const url = `https://api.github.com/repos/${params.owner}/${params.repository}/releases`;
    const options = {
        headers: {
            ...authHeaders(params.token),
            'Content-Type': 'application/json',
        },
    };

    const responseText = await httpRequest('POST', url, postData, options);
    const response = JSON.parse(responseText);

    return response.id;

}

export async function updateRelease(params: {
    token: string
    owner: string
    repository: string
    releaseId: number
    name: string
    body: string
    draft?: boolean
    prerelease?: boolean
}): Promise<void> {

    const {name, body, prerelease = false} = params;
    const patchData = JSON.stringify({
        name,
        body,
        draft: false,
        prerelease,
    });
    const url = `https://api.github.com/repos/${params.owner}/${params.repository}/releases/${params.releaseId}`;
    const options = {
        headers: {
            ...authHeaders(params.token),
            'Content-Type': 'application/json',
        },
    };

    await httpRequest('PATCH', url, patchData, options);

}

const DELETE_RELEASE_RETRIES = 3;
const DELETE_RELEASE_BACKOFF_MS = 500;

function isRetryableDeleteError(err: unknown): boolean {

    const message = err instanceof Error ? err.message : String(err);
    const code = (err as NodeJS.ErrnoException).code;

    return (
        code === 'ECONNRESET'
        || code === 'ETIMEDOUT'
        || code === 'ECONNREFUSED'
        || /socket hang up/i.test(message)
        || ((err as { status?: number }).status !== undefined && ((err as { status: number }).status >= 500))
    );

}

export async function deleteReleaseById(params: {
    token: string
    owner: string
    repository: string
    releaseId: number
}): Promise<void> {

    const url = `https://api.github.com/repos/${params.owner}/${params.repository}/releases/${params.releaseId}`;
    const options = {
        headers: authHeaders(params.token),
    };

    let lastErr: unknown;

    for (let attempt = 1; attempt <= DELETE_RELEASE_RETRIES; attempt++) {

        try {

            await httpRequest('DELETE', url, '', options);
            return;

        } catch (err) {

            lastErr = err;
            if (attempt < DELETE_RELEASE_RETRIES && isRetryableDeleteError(err)) {

                await new Promise((r) => setTimeout(r, DELETE_RELEASE_BACKOFF_MS * attempt));

            } else {

                break;

            }

        }

    }

    const logger = await import('./logger').then((m) => m.default);

    logger.error(`Rollback: failed to delete GitHub release (release ID ${params.releaseId}) after ${DELETE_RELEASE_RETRIES} attempt(s). `
        + 'You may need to delete the release manually in the GitHub UI.',);
    throw lastErr;

}
