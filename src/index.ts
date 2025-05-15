import {Infer} from 'typura';
import {commitType, validateConfig} from './config';

export type CommitType = Infer<typeof commitType>;
export type Config = Infer<typeof validateConfig>;

export * from './defaults';
export * from './config';
export * from './autorel';

