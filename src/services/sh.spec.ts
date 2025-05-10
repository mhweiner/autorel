import {test} from 'hoare';
import {bash, $} from './sh';

test('bash: single line', (assert) => {

    bash('echo "Hello, World!" > /dev/null');
    assert.equal(1, 1);

});

test('bash: multi line', (assert) => {

    bash(`
        echo "Two roads diverged in a yellow wood," > /dev/null
        echo "And sorry I could not travel both" > /dev/null
    `);
    assert.equal(1, 1);

});

test('bash: multi line with env var', (assert) => {

    // bash statement with env var
    bash(`
        greet="Hello"
        echo "$greet, World!" > ./tmp.txt
    `);

    // read the file and check the content
    const content = $`cat ./tmp.txt`;

    assert.equal(content, 'Hello, World!');

    // remove the file
    $`rm ./tmp.txt`;

});
