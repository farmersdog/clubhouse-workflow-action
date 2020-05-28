const Clubhouse = require('clubhouse-lib');

const clubhouseToken = process.env.INPUT_CLUBHOUSETOKEN;
const client = Clubhouse.create(clubhouseToken);

/**
 * Finds all clubhouse story IDs in body of release object.
 *
 * @param {string} releaseBody - The body field of a github release object.
 * @return {Array} - Clubhouse story IDs 1-7 digit strings.
 */

function extractStoryIds(releaseBody) {
    const regex = /(?<=ch)\d{1,7}/g;
    return releaseBody.match(regex);
}

/**
 * Creates a clubhouse story object with subset of properties for given id.
 *
 * @param {string} storyId - The clubhouse id for the story.
 * @return {Promise<Object>} - Clubhouse story object with required properties.
 */

async function addDetailstoStory(storyId) {
    try {
        const story = await client.getStory(storyId);
        return {
            // clubhouse represents all IDs as numbers
            storyId: story.id,
            projectId: story.project_id,
            name: story.name,
            description: story.description
        };
    } catch(err) {
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
 * @param {Array} storyIds - Clubhouse story IDs 1-7 digit strings.
 * @returns {Promise<Array>} - Clubhouse story objects with required properties.
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
 * @param {Object} story - Clubhouse story object.
 * @param {string} releaseUrl - URL to the triggering github release.
 * @return {Object} - Clubhouse story object with updated description.
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
 * @param {Array} stories - Clubhouse story objects.
 * @param {string} releaseUrl - URL to the triggering github release.
 * @param {boolean} shouldUpdateDescription - Whether to add release info to
 *                  descriptions.
 * @return {Array} - Clubhouse story objects possibly with updated descriptions.
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
 * @param {Object} story - Clubhouse story object.
 * @param {Array} workflows - Clubhouse workflow objects.
 * @param {string} endStateName - Name of the workflow state to tranisition
 *                 stories to.
 * @return {Object} - Clubhouse story object with ID of desired workflow end state.
 */

function addEndStateId(story, workflows, endStateName) {
    const workflow = workflows.find(
        workflow => workflow.project_ids.includes(story.projectId)
    );
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
 * @param {Array} stories - Clubhouse story objects.
 * @param {Array} workflows - Clubhouse workflow objects.
 * @param {string} endStateName - Name of the workflow state to tranisition stories to.
 * @return {Object} - Clubhouse story object with ID of desired workflow end state.
 */

function addEndStateIds(stories, workflows, endStateName) {
    return stories.map(story => addEndStateId(story, workflows, endStateName));
}

/**
 * Updates story with end workflow state and description.
 *
 * @param {Object} storyWithEndStateId - Clubhouse story object with desired end
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
 * @param {Array} storiesWithEndStateIds - Clubhouse story objects with desired
 *                end state.
 * @return {Promise<Array>} - Names of the stories that were updated.
 */

async function updateStories(storiesWithEndStateIds) {
    return await Promise.all(
        storiesWithEndStateIds.map(story => updateStory(story))
    );
}

/**
 * Updates all clubhouse stories mentioned in the body of a github release.
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
        console.warn('No clubhouse stories were found in the release.');
        return [];
    }
    const stories = await addDetailstoStories(storyIds, releaseUrl);
    const storiesWithUpdatedDescriptions = updateDescriptionsMaybe(
        stories,
        releaseUrl,
        shouldUpdateDescription
    );
    const workflows = await client.listWorkflows();
    const storiesWithEndStateIds = addEndStateIds(
        storiesWithUpdatedDescriptions,
        workflows,
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
    releaseStories
};
