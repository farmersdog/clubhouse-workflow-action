1. When new commit on existing Pull Request, Move story to Ready to Feature QA, unless commit message includes "[wip]"
2. Move owners as code reviews to github Pull Request

## Case 1: Story has 2 PRs

Story has 2 prs,
Gagu reviewed only 1 pr.

1. Move "In Development"
   If Branch Created (GAP, [Rule #1] if investigating, not writing code)
2. Move "Ready to Feature QA"
   If PR Created and All branches should have PR ([Rule #2])
3. Move "Ready to Code Review"
   If All PR's have Gagu's Approval (Latest Approvals.)
4. Move "Ready for Staging"
   If All PR's have Gagu's and Somebody elses Approval (Latest Approvals.)
5. Move "Test Fail"
   If Any PR's have Gagu Change Request (Latest Change Request.)([Rule #3])
6. Move "Test Fail" -> "In Development"
   Manually
7. Move "Test Fail" -> "Ready for Feature QA"
   Any Commit Except commit message includes "[wip]" and Gagu Requested Change

Rules:

1. If you start writing code. Make a branch and push.
2. If you created a branch and in the end don't need it. Delete it
3. Gagu should make change request to every PR
