/**
 *
 * @param {any[]} prs
 */
function PR_ALL_OK(prs) {
  return prs.every((pr) => pr.QAStatus === "OK" && pr.EngineerStatus === "OK");
}

/**
 *
 * @param {any[]} prs
 */
function PR_ALL_QA_OK(prs) {
  return prs.every((pr) => pr.QAStatus === "OK");
}

/**
 *
 * @param {any[]} prs
 */
function PR_ALL_ENG_OK(prs) {
  return prs.every((pr) => pr.EngineerStatus === "OK");
}

/**
 *
 * @param {any[]} prs
 */
function PR_ANY_QA_FAIL(prs) {
  return prs.some((pr) => pr.QAStatus === "FAIL");
}

/**
 *
 * @param {any[]} prs
 */
function PR_ANY_QA_CHANGE_COMMIT_NOT_WIP(prs) {
  return prs.some(
    (pr) => pr.QAStatusLatest === "FAIL" && !pr.IsLatestCommitWIP
  );
}

module.exports = {
  PR_ALL_OK,
  PR_ALL_QA_OK,
  PR_ALL_ENG_OK,
  PR_ANY_QA_FAIL,
  PR_ANY_QA_CHANGE_COMMIT_NOT_WIP,
};
