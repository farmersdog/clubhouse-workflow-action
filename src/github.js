const CONSTS = require("./consts");
const PR_REVIEWS_QUERY = `
query($name: String!, $owner: String!, $pull_number: Int!) {
  repository(name: $name, owner: $owner) {
    pullRequest(number: $pull_number) {
      reviews(last:50) {
        totalCount
        nodes {
          state
          publishedAt
          minimizedReason
          pullRequest{
            commits(last: 1){
              nodes{
                commit {
                    message
                    committedDate
                }
              }
            }
          }
          author {
          login
        }
      }
    }
  }
}
}
`;

function parsePullRequestFromUrl(pr) {
  const parsedUrl = pr.url
    .replace("https://github.com/", "")
    .replace(/\/pull.*/, "");
  const splitUrl = parsedUrl.split("/");
  return {
    prNum: pr.number,
    repoName: splitUrl[1],
    owner: splitUrl[0],
  };
}

function getReviewCommentStatus(reviewComment, ignoreTime = false) {
  if (!reviewComment) {
    return "NA";
  }
  if (
    !ignoreTime &&
    reviewComment?.pullRequest?.commits?.nodes?.[0]?.commit?.committedDate
  ) {
    if (
      new Date(reviewComment.publishedAt).getTime() <
      new Date(
        reviewComment.pullRequest.commits.nodes[0].commit.committedDate
      ).getTime()
    ) {
      return "NA";
    }
  }

  if (reviewComment.state === "APPROVED") {
    return "OK";
  } else {
    return "FAIL";
  }
}

/**
 *
 * @param {import("@actions/github/lib/interfaces").WebhookPayload | undefined} payload
 * @returns
 */
function getDataFromPR(payload) {
  if (!payload || !payload.pull_request) {
    throw new Error("No Pull Request in Payload");
  }
  return {
    title: payload.pull_request["title"],
    body: payload.pull_request["body"],
    ref: payload.pull_request["head"]["ref"],
  };
}

function getIsLatestCommitWIP(reviewComment) {
  const message =
    reviewComment?.pullRequest?.commits?.nodes?.[0]?.commit?.message || "";
  let shouldBypass = false;
  for (let i = 0; i < CONSTS.MOVE_TO_FEATURE_QA_COMMIT_BYPASS.length; i++) {
    const term = CONSTS.MOVE_TO_FEATURE_QA_COMMIT_BYPASS[i];
    if (message.toLowerCase().includes(term)) {
      shouldBypass = true;
      break;
    }
  }
  return shouldBypass;
}

async function getStoryGithubStats(storyId, client, octokit) {
  const story = await client.getStory(storyId);
  let totalBranches = 0;
  let branchesWithOpenPrs = 0;
  const prNumbers = [];
  for (const branch of story.data.branches) {
    totalBranches++;
    for (const pr of branch.pull_requests) {
      if (pr.closed === false && pr.merged === false) {
        branchesWithOpenPrs++;
        const parsed = parsePullRequestFromUrl(pr);
        prNumbers.push(parsed);
      }
    }
  }

  const allOpenPrs = await Promise.all(
    prNumbers.map(async (stat) => {
      const prResponse = await octokit.graphql(PR_REVIEWS_QUERY, {
        name: stat.repoName,
        owner: stat.owner,
        pull_number: stat.prNum,
      });
      if (!prResponse?.repository?.pullRequest?.reviews) {
        throw new Error(`Couldn't get PR Reviews, ${stat.prNum}`);
      }
      const nodesDesc = prResponse.repository.pullRequest.reviews.nodes.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      const latestQAReview = nodesDesc.find((item) =>
        CONSTS.QA_USERNAMES.find((username) => item.author.login === username)
      );
      const latestNonQAReview = nodesDesc.find(
        (item) =>
          !CONSTS.QA_USERNAMES.find(
            (username) => username === item.author.login
          )
      );
      const QAStatus = getReviewCommentStatus(latestQAReview);
      const QAStatusLatest = getReviewCommentStatus(latestQAReview, true);
      const EngineerStatus = getReviewCommentStatus(latestNonQAReview);
      const IsLatestCommitWIP = getIsLatestCommitWIP(
        latestQAReview || latestNonQAReview
      );
      return {
        prNumber: stat.prNum,
        repoName: stat.repoName,
        QAStatus,
        QAStatusLatest,
        EngineerStatus,
        IsLatestCommitWIP,
      };
    })
  );

  console.log(JSON.stringify(allOpenPrs, null, 2));
  return { totalBranches, branchesWithOpenPrs, allOpenPrs };
}

module.exports = {
  parsePullRequestFromUrl,
  getReviewCommentStatus,
  getDataFromPR,
  getStoryGithubStats,
};
