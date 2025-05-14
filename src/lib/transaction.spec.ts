import {test} from 'hoare';
import {transaction, Action} from './transaction';
import {toResultAsync} from './toResult';

test('executes the action without rollback if no error is thrown', async (assert) => {

    let actionCalled = false;
    let rollbackCalled = false;

    const action: Action = async (addToRollback) => {

        addToRollback(async () => {

            rollbackCalled = true;

        });
        actionCalled = true;

    };

    const [err] = await toResultAsync(transaction(action));

    assert.isTrue(!err, 'should not throw');
    assert.isTrue(actionCalled, 'action should be called');
    assert.isTrue(!rollbackCalled, 'rollback should not be called');

});

test('calls rollback if action throws', async (assert) => {

    const calls: string[] = [];

    const action: Action = async (addToRollback) => {

        addToRollback(async () => {

            calls.push('rollback');

        });
        throw new Error('fail');

    };

    const [err] = await toResultAsync(transaction(action));

    assert.isTrue(!!err, 'should throw');
    assert.equal(calls, ['rollback'], 'rollback should be called');
    assert.equal(err!.message, 'fail');

});

test('calls rollbacks in reverse order', async (assert) => {

    const calls: string[] = [];

    const action: Action = async (addToRollback) => {

        addToRollback(async () => {

            calls.push('r1');

        });
        addToRollback(async () => {

            calls.push('r2');

        });
        addToRollback(async () => {

            calls.push('r3');

        });
        throw new Error('fail');

    };

    await toResultAsync(transaction(action));
    assert.equal(calls, ['r3', 'r2', 'r1'], 'rollback should run in reverse');

});

test('rollback errors do not stop other rollbacks', async (assert) => {

    const calls: string[] = [];

    const action: Action = async (addToRollback) => {

        addToRollback(async () => {

            calls.push('r1');

        });
        addToRollback(async () => {

            throw new Error('fail');

        });
        addToRollback(async () => {

            calls.push('r3');

        });
        throw new Error('main fail');

    };

    await toResultAsync(transaction(action));
    assert.equal(calls, ['r3', 'r1'], 'rollback should continue after error');

});

test('rethrows original error even if rollback fails', async (assert) => {

    const action: Action = async (addToRollback) => {

        addToRollback(async () => {

            throw new Error('rollback fail');

        });
        throw new Error('original error');

    };

    const [err] = await toResultAsync(transaction(action));

    assert.isTrue(!!err, 'should throw');
    assert.equal(err!.message, 'original error');

});
