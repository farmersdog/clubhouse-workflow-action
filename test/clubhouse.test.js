const assert = require('assert');
const sinon = require('sinon');

const ch = require('../src/clubhouse');

describe('clubhouse module', function() {

    const release0 = `
### Features
[ch0002] feature 1
[ch1] feature 2
[ch12345] feature 3

### Bugs
[ch987] Bug 1
[ch56789] Bug 2
`;
    const release1 = `
ch4287 found a bug(ch890) blah
ch8576cool new stuff
[ch3]other thing
other bugch015
`;
    const release2 = '7895 [94536] (98453) #89';
    const release3 = 'tchotchke ch-thing chi789';
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
        const expectedIds0 = ['0002', '1', '12345', '987', '56789'];
        const expectedIds1 = ['4287', '890', '8576', '3', '015'];
        const expectedIds2 = null;
        const expectedIds3 = null;

        it('should find all story ids in well formatted release', function () {
            const storyIds = ch.extractStoryIds(release0);
            assert.deepEqual(storyIds, expectedIds0);
        });

        it('should find all story ids in poorly formatted release', function () {
            const storyIds = ch.extractStoryIds(release1);
            assert.deepEqual(storyIds, expectedIds1);
        });

        it('should not match plain number strings', function () {
            const storyIds = ch.extractStoryIds(release2);
            assert.strictEqual(storyIds, expectedIds2);
        });

        it('should not match other strings beginning in "ch"', function () {
            const storyIds = ch.extractStoryIds(release3);
            assert.strictEqual(storyIds, expectedIds3);
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
            const story = {description: expectedDescription1};
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
            assert.deepEqual(stories, newStories);
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
        afterEach(function() {
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
