const assert = require('assert/strict');

const { ObjectTreeWalker, ObjectUtils } = require('../index');

describe('Test ObjectTreeWalker', () => {

    let buildCascadedObject = () => {
        /**
         * -- root
         *    |-- dir1
         *    |   |-- file1
         *    |   |-- dir2
         *    |       |--- file2
         *    |       |--- file3
         *    |-- dir3
         *    |   |-- file4
         *    |   |-- file5
         *    |   |-- file6
         *    |   |-- file7
         *    |
         *    |-- file8
         *    |-- file9
         */

        let dir2 = new Node('dir2', [
            new Node('file2'),
            new Node('file3')
        ]);

        let dir1 = new Node('dir1', [
            new Node('file1'),
            dir2
        ]);

        let dir3 = new Node('dir3', [
            new Node('file4'),
            new Node('file5'),
            new Node('file6'),
            new Node('file7')
        ]);

        let root = new Node('root', [
            dir1,
            dir3,
            new Node('file8'),
            new Node('file9')
        ]);

        return root;
    };

    let nameEquals = (value) => {
        return ObjectTreeWalker.propMatchFunc('name', value);
    };

    it('Test findChild()', () => {
        let rootNode = buildCascadedObject();
        let file3 = ObjectTreeWalker.findChild(rootNode, nameEquals('file3'));
        assert.equal(file3.name, 'file3');

        let dir3 = ObjectTreeWalker.findChild(rootNode, nameEquals('dir3'));
        assert.equal(dir3.name, 'dir3');

        let file9 = ObjectTreeWalker.findChild(rootNode, nameEquals('file9'));
        assert.equal(file9.name, 'file9');

        let file10 = ObjectTreeWalker.findChild(rootNode, nameEquals('file10'));
        assert(file10 === undefined);
    });

    it('Test findNextSiblingInCascadedObject()', () => {
        let rootNode = buildCascadedObject();
        let file7 = ObjectTreeWalker.findNextSiblingInCascadedObject(rootNode, nameEquals('file6'));
        assert.equal(file7.name, 'file7');

        let file7next = ObjectTreeWalker.findNextSiblingInCascadedObject(rootNode, nameEquals('file7'));
        assert(file7next === null);

        let dir3 = ObjectTreeWalker.findNextSiblingInCascadedObject(rootNode, nameEquals('dir1'));
        assert.equal(dir3.name, 'dir3');

        let file8 = ObjectTreeWalker.findNextSiblingInCascadedObject(rootNode, nameEquals('dir3'));
        assert.equal(file8.name, 'file8');

        let file9next = ObjectTreeWalker.findNextSiblingInCascadedObject(rootNode, nameEquals('file9'));
        assert(file9next === null);

        let file10next = ObjectTreeWalker.findNextSiblingInCascadedObject(rootNode, nameEquals('file10'));
        assert(file10next === undefined);
    });

    it('Test findPreviousSiblingInCascadedObject()', () => {
        let rootNode = buildCascadedObject();
        let file4 = ObjectTreeWalker.findPreviousSiblingInCascadedObject(rootNode, nameEquals('file5'));
        assert.equal(file4.name, 'file4');

        let file4previous = ObjectTreeWalker.findPreviousSiblingInCascadedObject(rootNode, nameEquals('file4'));
        assert(file4previous === null);

        let dir3 = ObjectTreeWalker.findPreviousSiblingInCascadedObject(rootNode, nameEquals('file8'));
        assert.equal(dir3.name, 'dir3');

        let dir1 = ObjectTreeWalker.findPreviousSiblingInCascadedObject(rootNode, nameEquals('dir3'));
        assert.equal(dir1.name, 'dir1');

        let dir1previous = ObjectTreeWalker.findPreviousSiblingInCascadedObject(rootNode, nameEquals('dir1'));
        assert(dir1previous === null);

        let file0previous = ObjectTreeWalker.findPreviousSiblingInCascadedObject(rootNode, nameEquals('file0'));
        assert(file0previous === undefined);
    });

    it('Test flatten()', () => {
        let rootNode = buildCascadedObject();
        let nodes = ObjectTreeWalker.flatten(rootNode);

        let nodeNames = nodes.map(node => node.name);
        assert(ObjectUtils.arrayEquals(nodeNames, [
            'root',
            'dir1',
            'file1',
            'dir2',
            'file2',
            'file3',
            'dir3',
            'file4',
            'file5',
            'file6',
            'file7',
            'file8',
            'file9']
        ));
    });

    it('Test findNextChild()', () => {
        let rootNode = buildCascadedObject();

        let next1 = ObjectTreeWalker.findNextChild(rootNode, nameEquals('root'));
        assert.equal(next1.name, 'dir1');

        let next2 = ObjectTreeWalker.findNextChild(rootNode, nameEquals('file1'));
        assert.equal(next2.name, 'dir2');

        let next3 = ObjectTreeWalker.findNextChild(rootNode, nameEquals('file2'));
        assert.equal(next3.name, 'file3');

        let next4 = ObjectTreeWalker.findNextChild(rootNode, nameEquals('file3'));
        assert.equal(next4.name, 'dir3');

        let next5 = ObjectTreeWalker.findNextChild(rootNode, nameEquals('file9'));
        assert(next5 === null);

        let next6 = ObjectTreeWalker.findNextChild(rootNode, nameEquals('file10'));
        assert(next6 === undefined);
    });

    it('Test findPreviousChild()', () => {
        let rootNode = buildCascadedObject();

        let prev1 = ObjectTreeWalker.findPreviousChild(rootNode, nameEquals('file9'));
        assert.equal(prev1.name, 'file8');

        let prev2 = ObjectTreeWalker.findPreviousChild(rootNode, nameEquals('file8'));
        assert.equal(prev2.name, 'file7');

        let prev3 = ObjectTreeWalker.findPreviousChild(rootNode, nameEquals('file7'));
        assert.equal(prev3.name, 'file6');

        let prev4 = ObjectTreeWalker.findPreviousChild(rootNode, nameEquals('file4'));
        assert.equal(prev4.name, 'dir3');

        let prev5 = ObjectTreeWalker.findPreviousChild(rootNode, nameEquals('dir3'));
        assert.equal(prev5.name, 'file3');

        let prev6 = ObjectTreeWalker.findPreviousChild(rootNode, nameEquals('root'));
        assert(prev6 === null);

        let prev7 = ObjectTreeWalker.findPreviousChild(rootNode, nameEquals('file0'));
        assert(prev7 === undefined);
    });
});

class Node {
    constructor(name, children = []) {
        this.name = name;
        this.children = children;
    }
}