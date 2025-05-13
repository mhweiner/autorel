export type CommitType = {
    type: string
    title: string
    release: 'minor' | 'patch' | 'none'
};
export type ReleaseBranch = {
    name: string
    prereleaseChannel?: string
};
export type Config = {
    dryRun?: boolean
    run?: string
    preRun?: string
    runScript?: string
    prereleaseChannel?: string
    useVersion?: string
    skipRelease?: boolean
    publish?: boolean
    breakingChangeTitle: string
    commitTypes: CommitType[]
    branches: ReleaseBranch[]
};

export * from './defaults';
export * from './config';
export * from './autorel';

