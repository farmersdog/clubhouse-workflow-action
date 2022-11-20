const { ShortcutClient } = require('@useshortcut/client');

const shortcutToken = process.env.INPUT_CLUBHOUSETOKEN;
const client = new ShortcutClient(shortcutToken);

/**
 * Finds all shortcut story IDs in some string content.
 *
 * @param {string} content - content that may contain story IDs.
 * @return {Array} - shortcut story IDs 1-7 digit strings.
 */

function extractStoryIds(content) {
    const regex = /(?<=sc|sc-|ch|ch-)\d{1,7}/gi;
    const all = content.match(regex);
    const unique = [...new Set(all)];
    return unique;
}

/**
 * Creates a shortcut story object with subset of properties for given id.
 *
 * @param {string} storyId - The shortcut id for the story.
 * @return {Promise<Object>} - shortcut story object with required properties.
 */

async function addDetailstoStory(storyId) {
    try {
        const story = await client.getStory(storyId);
        return {
            // shortcut represents all IDs as numbers
            storyId: story.id,
            name: story.name,
            description: story.description,
            workflow_id: story.workflow_id,
            workflow_state_id: story.workflow_state_id
        };
    } catch (err) {
        if (err.response.status === 404) {
            console.log(`Could not locate story: ${storyId}`);
            return storyId;
        } else {
            throw err;
        }
    }
}

/**
 * Creates array of story objects for given array of story ids.
 *
 * @param {Array} storyIds - shortcut story IDs 1-7 digit strings.
 * @returns {Promise<Array>} - shortcut story objects with required properties.
 */

async function addDetailstoStories(storyIds) {
    const stories = await Promise.all(
        storyIds.map(id => addDetailstoStory(id))
    );
    return stories.filter(story => {
        if (typeof story === 'string') {
            return false;
        } else {
            return true;
        }
    });
}

/**
 * Creates a new story object with updated description containing release info.
 *
 * @param {Object} story - shortcut story object.
 * @param {string} releaseUrl - URL to the triggering github release.
 * @return {Object} - shortcut story object with updated description.
 */

function updateDescription(story, releaseUrl) {
    if (story.description.includes('Release Info')) {
        return story;
    }
    const releaseSection = `

### Release Info
${releaseUrl}
`;
    const newDescription = story.description + releaseSection;
    return {
        ...story,
        description: newDescription
    };
}

/**
 * Conidtionally creates an array of new story objects with updated description
 * containing release info from array of story objects.
 *
 * @param {Array} stories - shortcut story objects.
 * @param {string} releaseUrl - URL to the triggering github release.
 * @param {boolean} shouldUpdateDescription - Whether to add release info to
 *                  descriptions.
 * @return {Array} - shortcut story objects possibly with updated descriptions.
 */

function updateDescriptionsMaybe(stories, releaseUrl, shouldUpdateDescription) {
    if (shouldUpdateDescription) {
        return stories.map(story => updateDescription(story, releaseUrl));
    } else {
        return stories;
    }
}

/**
 * Creates a new story object with added workflow state id for desired end state.
 *
 * @param {Object} story - shortcut story object.
 * @param {Array} workflows - shortcut workflow objects.
 * @param {string} endStateName - Name of the workflow state to tranisition
 *                 stories to.
 * @return {Object} - shortcut story object with ID of desired workflow end state.
 */

function addEndStateId(story, endStateName) {
    const workflow = client.getWorkflow(story.workflow_id);
    const workflowState = workflow.states.find(
        state => state.name === endStateName
    );
    return {
        ...story,
        endStateId: workflowState.id
    };
}

/**
 * Creates a new array of story objects with added workflow state id for desired
 * end state.
 *
 * @param {Array} stories - shortcut story objects.
 * @param {Array} workflows - shortcut workflow objects.
 * @param {string} endStateName - Name of the workflow state to tranisition stories to.
 * @return {Object} - shortcut story object with ID of desired workflow end state.
 */

function addEndStateIds(stories, endStateName) {
    return stories.map(story => addEndStateId(story, endStateName));
}

/**
 * Updates story with end workflow state and description.
 *
 * @param {Object} storyWithEndStateId - shortcut story object with desired end
 *                 state.
 * @return {Promise<String>} - Name of updated story.
 */

async function updateStory(storyWithEndStateId) {
    const params = {
        description: storyWithEndStateId.description,
        workflow_state_id: storyWithEndStateId.endStateId
    };
    const updatedStory = await client.updateStory(
        storyWithEndStateId.storyId,
        params
    );
    if (updatedStory.workflow_state_id !== storyWithEndStateId.endStateId) {
        throw new Error(
            `Tranistion failed for story ${storyWithEndStateId.storyId}`
        );
    }
    return updatedStory.name;
}

/**
 * Updates array of stories with end workflow state and description.
 *
 * @param {Array} storiesWithEndStateIds - shortcut story objects with desired
 *                end state.
 * @return {Promise<Array>} - Names of the stories that were updated.
 */

async function updateStories(storiesWithEndStateIds) {
    return await Promise.all(
        storiesWithEndStateIds.map(story => updateStory(story))
    );
}

/**
 * Updates all shortcut stories mentioned in the body of a github release.
 *
 * @param {string} releaseBody - Body property of github release object.
 * @param {string} endStateName - Desired workflow state for stories.
 * @param {string} releaseUrl - URL to the triggering github release.
 * @param {boolean} shouldUpdateDescription - Whether to add release info to
 *                  descriptions.
 * @return {Promise<Array>} - Names of the stories that were updated
 */

async function releaseStories(
    releaseBody,
    endStateName,
    releaseUrl,
    shouldUpdateDescription
) {
    const storyIds = extractStoryIds(releaseBody);
    if (storyIds === null) {
        console.warn('No shortcut stories were found in the release.');
        return [];
    }
    const stories = await addDetailstoStories(storyIds);
    const storiesWithUpdatedDescriptions = updateDescriptionsMaybe(
        stories,
        releaseUrl,
        shouldUpdateDescription
    );
    const storiesWithEndStateIds = addEndStateIds(
        storiesWithUpdatedDescriptions,
        endStateName
    );
    const updatedStoryNames = await updateStories(storiesWithEndStateIds);
    return updatedStoryNames;
}

/**
 * Updates all shortcut stories found in given content.
 *
 * @param {string} content - a string that might have shortcut story IDs.
 * @param {string} endStateName - Desired workflow state for stories.
 * @return {Promise<Array>} - Names of the stories that were updated
 */

async function transitionStories(
    content,
    endStateName
) {
    const storyIds = extractStoryIds(content);
    if (storyIds.length === 0) {
        console.warn('No shortcut stories were found.');
        return storyIds;
    }
    const stories = await addDetailstoStories(storyIds);
    const storiesWithEndStateIds = addEndStateIds(
        stories,
        endStateName
    );
    const updatedStoryNames = await updateStories(storiesWithEndStateIds);
    return updatedStoryNames;
}

module.exports = {
    client,
    extractStoryIds,
    addDetailstoStory,
    addDetailstoStories,
    updateDescription,
    updateDescriptionsMaybe,
    addEndStateId,
    addEndStateIds,
    updateStory,
    updateStories,
    releaseStories,
    transitionStories
};
