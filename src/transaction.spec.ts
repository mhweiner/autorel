import {test} from 'hoare';
import {Action, transaction} from './transaction';
import {stub} from 'cjs-mock';
import {toResultAsync} from './lib/toResult';

test('executes the action without rollback if no error is thrown', async (assert) => {

    let actionCalled = false;
    let rollbackCalled = false;

    const action: Action = async (addToRollback) => {

        addToRollback(async () => {

            rollbackCalled = true;

        });
        actionCalled = true;

    };
    const onRollbackStub = stub();
    const onRollbackErrorStub = stub();

    const [err] = await toResultAsync(transaction(action, onRollbackStub, onRollbackErrorStub));

    assert.isTrue(!err, 'should not throw');
    assert.isTrue(actionCalled, 'action should be called');
    assert.isTrue(!rollbackCalled, 'rollback should not be called');
    assert.equal(onRollbackStub.getCalls().length, 0, 'onRollback should not be called');
    assert.equal(onRollbackErrorStub.getCalls().length, 0, 'onRollbackError should not be called');

});

test('calls rollback if action throws', async (assert) => {

    const calls: string[] = [];

    const action: Action = async (addToRollback) => {

        addToRollback(async () => {

            calls.push('rollback');

        });
        throw new Error('fail');

    };
    const onRollbackStub = stub();
    const onRollbackErrorStub = stub();

    const [err] = await toResultAsync(transaction(action, onRollbackStub, onRollbackErrorStub));

    assert.isTrue(!!err, 'should throw');
    assert.equal(calls, ['rollback'], 'rollback should be called');
    assert.equal(err!.message, 'fail');
    assert.equal(onRollbackStub.getCalls().length, 1, 'onRollback should be called once');
    assert.equal(onRollbackErrorStub.getCalls().length, 0, 'onRollbackError should not be called');

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
    const onRollbackStub = stub();
    const onRollbackErrorStub = stub();

    await toResultAsync(transaction(action, onRollbackStub, onRollbackErrorStub));
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
    const onRollbackStub = stub();
    const onRollbackErrorStub = stub();

    await toResultAsync(transaction(action, onRollbackStub, onRollbackErrorStub));
    assert.equal(calls, ['r3', 'r1'], 'rollback should continue after error');
    assert.equal(onRollbackStub.getCalls().length, 1, 'onRollback should be called once');
    assert.equal(onRollbackErrorStub.getCalls().length, 1, 'onRollbackError should be called once');

});

test('rethrows original error even if rollback fails', async (assert) => {

    const action: Action = async (addToRollback) => {

        addToRollback(async () => {

            throw new Error('rollback fail');

        });
        throw new Error('original error');

    };
    const onRollbackStub = stub();
    const onRollbackErrorStub = stub();

    const [err] = await toResultAsync(transaction(action, onRollbackStub, onRollbackErrorStub));

    assert.isTrue(!!err, 'should throw');
    assert.equal(err!.message, 'original error');
    assert.equal(onRollbackStub.getCalls().length, 1, 'onRollback should be called once');
    assert.equal(onRollbackErrorStub.getCalls().length, 1, 'onRollbackError should be called once');

});
