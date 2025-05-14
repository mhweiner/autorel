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

        // Rollback all actions
        for (const rollbackAction of rollbackActions.reverse()) {

            try {

                await rollbackAction();

            } catch (rollbackError) {

                console.error('Rollback failed:', rollbackError);

            }

        }

        throw error;

    }

}
