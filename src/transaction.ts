export type AddToRollback = (action: () => Promise<void>) => void;
export type Action = (addToRollback: AddToRollback) => Promise<void>;

export async function transaction(
    action: Action,
    onRollback: (err: any) => void,
    onRollbackError: (err: any) => void,
): Promise<void> {

    const rollbackActions: (() => Promise<void>)[] = [];
    const addToRollback: AddToRollback = (action) => {

        rollbackActions.push(action);

    };

    try {

        return await action(addToRollback);

    } catch (err) {

        onRollback(err);

        // Rollback all actions
        for (const rollbackAction of rollbackActions.reverse()) {

            try {

                await rollbackAction();

            } catch (rollbackError) {

                // Log the error but continue with the rollback
                onRollbackError(rollbackError as Error);

            }

        }

        // Rethrow the original error after rollback
        throw err;

    }

}
