export type SemVer = {
    major: number
    minor: number
    patch: number
    channel?: string
    build?: number
};
export type ReleaseType = 'major' | 'minor' | 'patch' | 'none';
