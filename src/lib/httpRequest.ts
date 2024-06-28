/* eslint-disable max-lines-per-function */
import http from 'node:http';
import https from 'node:https';
import {URL} from 'node:url';
import {toResultAsync} from './toResult';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class Non200Response extends Error {

    status: number;
    response: unknown;
    request: string;

    constructor(status: number, response: unknown, request: string) {

        super('Non200Response');
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = 'Non200Response';
        this.status = status;
        this.response = response;
        this.request = request;

    }

}

export async function httpRequest(
    method: HttpMethod,
    url: string,
    body?: string,
    options?: http.RequestOptions,
): Promise<string> {

    const urlObj = new URL(url);
    const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        protocol: urlObj.protocol,
        method,
        ...options,
    };

    const [err, resp] = await toResultAsync(httpRequestPromise(requestOptions, body));

    if (err) {

        throw err;

    }

    const responseData = await new Promise((resolve, reject) => {

        let data = '';

        resp.on('data', (chunk) => data += chunk);
        resp.on('end', () => resolve(data));
        resp.on('error', reject);

    }) as string;
    const statusCode = resp.statusCode || 0;


    if (statusCode < 200 || statusCode > 299) {

        throw new Non200Response(
            statusCode,
            responseData,
            `${method} ${url}`,
        );

    }

    return responseData;

}

async function httpRequestPromise(options: https.RequestOptions, body?: string): Promise<http.IncomingMessage> {

    return new Promise((resolve, reject) => {

        const req = options.protocol === 'https:' ? https.request(options, resolve) : http.request(options, resolve);

        req.on('error', reject);
        req.write(body || '');
        req.end();

    });

}

