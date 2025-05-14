import {inspect} from 'util';
import logger from './services/logger';

export type AddToRollback = (action: () => Promise<void>) => void;
export type Action = (addToRollback: AddToRollback) => Promise<void>;

export async function transaction(action: Action): Promise<void> {

    const rollbackActions: (() => Promise<void>)[] = [];
    const addToRollback: AddToRollback = (action) => {

        rollbackActions.push(action);

    };

    try {

        return await action(addToRollback);

    } catch (error) {

        logger.error('An error occurred during deployment, rolling back...');
        logger.error(inspect(error, {depth: null, colors: false}));

        // Rollback all actions
        for (const rollbackAction of rollbackActions.reverse()) {

            try {

                await rollbackAction();

            } catch (rollbackError) {

                // Log the error but continue with the rollback
                logger.error('An error occurred during rollback:');
                logger.error(inspect(rollbackError, {depth: null, colors: false}));

            }

        }

        throw error;

    }

}
