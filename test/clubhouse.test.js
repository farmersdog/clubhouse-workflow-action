const assert = require('assert');
const sinon = require('sinon');

const ch = require('../src/clubhouse');

class ClientError extends Error {
    constructor(response) {
        super('error msg');
        this.response = response;
    }
}

describe('clubhouse module', function () {

    const release0 = `
### Features
[sc0002] feature 1
[sc1] feature 2
[sc12345] feature 3
[sc-123456] feature 4
[SC-42] feature 5

### Bugs
[sc987] Bug 1
[sc56789] Bug 2
[sc-314] Bug 3
[Sc2] Bug 4
`;
    const release1 = `
sc4287 found a bug(sc890) blah
sc8576cool new stuff
[sc3]other thing
other bugsc015
someSC88foo
Thissc-33th
`;

    const oldFormatRelease0 = `
### Old format features
[ch0002] feature 1
[ch1] feature 2
[ch12345] feature 3
[ch-123456] feature 4
[CH-42] feature 5

### Old format Bugs
[ch987] Bug 1
[ch56789] Bug 2
[ch-314] Bug 3
[Ch2] Bug 4
`;
    const oldFormatRelease1 = `
ch4287 found a bug(ch890) blah
ch8576cool new stuff
[ch3]other thing
other bugch015
someCH88foo
Thisch-33th
`;

    const release2 = '7895 [94536] (98453) #89';
    const release3 = 'tshotscke sc-thing sci789 CZESHAIR SC-some2';
    const oldFormatRelease3 = 'tshotchke ch-thing chi789 CZESHAIR CH-some2';
    const prTitle = 'Re-writing the app in another language [sc1919]';
    const oldFormatprTitle = 'Re-writing the app in another language [ch1919]';
    const branch = 'user/sc2189/something-important-maybe';
    const oldFormatBranch = 'user/ch2189/something-important-maybe';
    const duplicates = 'Only one change [sc6754] SC6754 [sc-6754]';
    const oldFormatDuplicates = 'Only one change [ch6754] CH6754 [ch-6754]';
    const releaseUrl = 'https://github.com/org/repo/releases/14';
    const stories = [
        {
            storyId: 1234,
            projectId: 987,
            name: 'cool feature 19',
            description: 'the customers really want this thing, product is certain'
        },
        {
            storyId: 5678,
            projectId: 1010,
            name: 'terrible bug 37',
            description: ''
        }
    ];
    const completedStateId = 500000019;
    const doneStateId = 600000019;
    const workflows = [
        {
            "entity_type": "workflow",
            "project_ids": [
                2612,
                247,
                15857,
                987
            ],
            "states": [
                {
                    "entity_type": "workflow-state",
                    "name": "Ready for Dev",
                    "id": 500000017
                },
                {
                    "entity_type": "workflow-state",
                    "name": "In Progress",
                    "id": 500000018
                },
                {
                    "entity_type": "workflow-state",
                    "name": "Ready for Deploy",
                    "id": 500000020
                },
                {
                    "name": "Completed",
                    "entity_type": "workflow-state",
                    "id": completedStateId
                }
            ],
            "name": "Engineering"
        },
        {
            "entity_type": "workflow",
            "project_ids": [
                487,
                40,
                1010
            ],
            "states": [
                {
                    "entity_type": "workflow-state",
                    "name": "Ready",
                    "id": 600000020
                },
                {
                    "entity_type": "workflow-state",
                    "name": "In Progress",
                    "id": 600000018
                },
                {
                    "entity_type": "workflow-state",
                    "name": "Done",
                    "id": doneStateId
                },
            ],
            "name": "Product"
        }
    ];
    describe('story id extraction from release body', function () {
        const expectedIds0 = ['0002', '1', '12345', '123456', '42', '987', '56789', '314', '2'];
        const expectedIds1 = ['4287', '890', '8576', '3', '015', '88', '33'];
        const expectedIds2 = [];
        const expectedIds3 = [];
        const expectedIdsPR = ['1919'];
        const expectedIdsBranch = ['2189'];
        const expectedIdsDups = ['6754'];

        it('should find all story ids in well formatted release', function () {
            const storyIds = ch.extractStoryIds(release0);
            assert.deepStrictEqual(storyIds, expectedIds0);
        });

        it('should find all story ids in poorly formatted release', function () {
            const storyIds = ch.extractStoryIds(release1);
            assert.deepStrictEqual(storyIds, expectedIds1);
        });

        it('should not match plain number strings', function () {
            const storyIds = ch.extractStoryIds(release2);
            assert.deepStrictEqual(storyIds, expectedIds2);
        });

        it('should not match other strings beginning in "sc"', function () {
            const storyIds = ch.extractStoryIds(release3);
            assert.deepStrictEqual(storyIds, expectedIds3);
        });

        it('should find 1 story id in PR Title', function () {
            const storyIds = ch.extractStoryIds(prTitle);
            assert.deepStrictEqual(storyIds, expectedIdsPR);
        });

        it('should find 1 story id in branch name', function () {
            const storyIds = ch.extractStoryIds(branch);
            assert.deepStrictEqual(storyIds, expectedIdsBranch);
        });

        it('should find 1 story id from duplicates', function () {
            const storyIds = ch.extractStoryIds(duplicates);
            assert.deepStrictEqual(storyIds, expectedIdsDups);
        });
    });

    describe('story id extraction from release body in old format', function () {
        const expectedIds0 = ['0002', '1', '12345', '123456', '42', '987', '56789', '314', '2'];
        const expectedIds1 = ['4287', '890', '8576', '3', '015', '88', '33'];
        const expectedIds3 = [];
        const expectedIdsPR = ['1919'];
        const expectedIdsBranch = ['2189'];
        const expectedIdsDups = ['6754'];

        it('should find all story ids in well formatted release', function () {
            const storyIds = ch.extractStoryIds(oldFormatRelease0);
            assert.deepStrictEqual(storyIds, expectedIds0);
        });

        it('should find all story ids in poorly formatted release', function () {
            const storyIds = ch.extractStoryIds(oldFormatRelease1);
            assert.deepStrictEqual(storyIds, expectedIds1);
        });

        it('should not match other strings beginning in "ch"', function () {
            const storyIds = ch.extractStoryIds(oldFormatRelease3);
            assert.deepStrictEqual(storyIds, expectedIds3);
        });

        it('should find 1 story id in PR Title', function () {
            const storyIds = ch.extractStoryIds(oldFormatprTitle);
            assert.deepStrictEqual(storyIds, expectedIdsPR);
        });

        it('should find 1 story id in branch name', function () {
            const storyIds = ch.extractStoryIds(oldFormatBranch);
            assert.deepStrictEqual(storyIds, expectedIdsBranch);
        });

        it('should find 1 story id from duplicates', function () {
            const storyIds = ch.extractStoryIds(oldFormatDuplicates);
            assert.deepStrictEqual(storyIds, expectedIdsDups);
        });
    });

    describe('adding details to stories', function () {
        afterEach(function () {
            sinon.restore();
        });
        it('should return story id for 404 not found', async function () {
            let stubbedClient = sinon.stub(ch.client, 'getStory');
            stubbedClient.throws(function () {
                const err = new ClientError({ status: 404 });
                return err;
            });
            const story = await ch.addDetailstoStory('27543');
            assert.strictEqual(story, '27543');
        });

        it('should throw for other errors', function () {
            async function shouldThrow() {
                await ch.addDetailstoStory('27543');
            }
            let stubbedClient = sinon.stub(ch.client, 'getStory');
            stubbedClient.throws(function () {
                const err = new ClientError({ status: 500 });
                return err;
            });
            assert.rejects(
                shouldThrow,
                Error,
                'error msg'
            );
        });
    });

    describe('updating story descriptions', function () {
        const expectedDescription0 = `the customers really want this thing, product is certain

### Release Info
https://github.com/org/repo/releases/14
`;
        const expectedDescription1 = `

### Release Info
https://github.com/org/repo/releases/14
`;
        it('should update a description with content', function () {
            const newStory = ch.updateDescription(stories[0], releaseUrl);
            assert.strictEqual(newStory.description, expectedDescription0);
        });

        it('should update a description without content', function () {
            const newStory = ch.updateDescription(stories[1], releaseUrl);
            assert.strictEqual(newStory.description, expectedDescription1);
        });

        it('should not update a description that has release info', function () {
            const story = { description: expectedDescription1 };
            const newStory = ch.updateDescription(story, releaseUrl);
            assert.strictEqual(newStory.description, expectedDescription1);
        });


        it('should preserve other properties of story', function () {
            const newStory = ch.updateDescription(stories[0], releaseUrl);
            assert(
                'storyId' in newStory
                && 'projectId' in newStory
                && 'name' in newStory
            );
        });

        it('should update descriptions when true', function () {
            const newStories = ch.updateDescriptionsMaybe(
                stories,
                releaseUrl,
                true
            );
            assert(
                newStories[0].description !== stories[0].description
                && newStories[1].description !== stories[1].description
            );
        });

        it('should not update descriptions when false', function () {
            const newStories = ch.updateDescriptionsMaybe(
                stories,
                releaseUrl,
                false
            );
            assert.deepStrictEqual(stories, newStories);
        });
    });

    describe('Adding the end workflow state id to stories', function () {

        it('should add expected id when end state name is "Completed"', function () {
            const newStory = ch.addEndStateId(stories[0], workflows, "Completed");
            assert.strictEqual(newStory.endStateId, completedStateId);
        });

        it('should add expected id when end state name is not "Completed"', function () {
            const newStory = ch.addEndStateId(stories[1], workflows, "Done");
            assert.strictEqual(newStory.endStateId, doneStateId);
        });

        it('should preserve other properties of story', function () {
            const newStory = ch.addEndStateId(stories[0], workflows, "Completed");
            assert(
                'storyId' in newStory
                && 'projectId' in newStory
                && 'name' in newStory
                && 'description' in newStory
            );
        });
    });

    describe("Updating stories with the clubhouse api", function () {
        afterEach(function () {
            sinon.restore();
        });
        const story = stories[0];
        const storyWithEndStateId = ch.addEndStateId(
            story,
            [workflows[0]],
            "Completed"
        );

        it('should succeed when returns updated story', async function () {
            const returnedStory = {
                ...storyWithEndStateId,
                workflow_state_id: storyWithEndStateId.endStateId
            };
            let stubbedClient = sinon.stub(ch.client, 'updateStory');
            stubbedClient.returns(returnedStory);
            const name = await ch.updateStory(storyWithEndStateId);
            assert(
                stubbedClient.calledOnceWith(storyWithEndStateId.storyId)
                && name === 'cool feature 19'
            );
        });

        it('should error when it returns not updated story', function () {
            async function shouldThrow() {
                await ch.updateStory(storyWithEndStateId);
            }
            const returnedStory = {
                ...storyWithEndStateId,
                workflow_state_id: storyWithEndStateId.endStateId - 10
            };
            let stubbedClient = sinon.stub(ch.client, 'updateStory');
            stubbedClient.returns(returnedStory);
            assert.rejects(
                shouldThrow,
                Error,
                `Tranistion failed for story ${storyWithEndStateId.storyId}`
            );
            assert(stubbedClient.calledOnceWith(storyWithEndStateId.storyId));
        });
    });
});
