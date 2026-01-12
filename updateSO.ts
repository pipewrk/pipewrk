import { getStackOverflowData } from "./fetchSO";
import { updateReadmeSection } from "./utils";

async function updateReadme(username: string, token: string): Promise<void> {
  try {
    const { reputation, answers, badges, topTags, impact } =
      await getStackOverflowData();

    // ✅ Ensure answers exist & fetch titles using question_id
    // ✅ Sort answers by score (descending) before slicing
    const answersSection =
      (answers ?? [])
        .sort((a, b) => b.score - a.score) // Sorting first
        .slice(0, 5) // Then slicing
        .map(
          ({ score, question_id }) =>
            `- **${score} upvotes** → [View Answer](https://stackoverflow.com/a/${question_id})`
        )
        .join("\n") || "No answers available.";

    // ✅ Sort top tags by answer_score (descending) before slicing
    const topTagsSection =
      (topTags ?? [])
        .sort((a, b) => b.answer_score - a.answer_score) // Sorting first
        .slice(0, 5) // Then slicing
        .map(
          ({ tag_name, answer_score, answer_count }) =>
            `- **${tag_name}** → ${answer_count} answers (**${answer_score} score**)`
        )
        .join("\n") || "No tag data available.";

    // ✅ Fix badge properties
    // ✅ Fix badge properties using authoritative counts from user profile
    const counts = reputation?.[0]?.badge_counts;
    const gold = counts?.gold ?? 0;
    const silver = counts?.silver ?? 0;
    const bronze = counts?.bronze ?? 0;

    const badgesSection = `🏅 **Badges:** ${gold} Gold | ${silver} Silver | ${bronze} Bronze`;

    // ✅ Fix Impact Section
    const impactSection = `👀 **Impact:** ${impact ?? "Unknown"
      } people reached`;

    // ✅ Fix Reputation Handling
    const reputationScore = reputation?.[0].reputation ?? "Unknown";

    // ✅ Final README Content
    const stackOverflowSection = `
### Stack Overflow Contributions
I've helped **${impact ?? "Unknown"
      } developers** on Stack Overflow, earning **${reputationScore} reputation points**.

🏆 **Top Answers**
${answersSection}

🏷 **Top Tags**
${topTagsSection}

${badgesSection}  
${impactSection}  

🔗 **[View Full Profile](https://stackoverflow.com/users/382536/jason-joseph-nathan?tab=profile)**
`;

    updateReadmeSection(
      "<!-- STACKOVERFLOW:START -->",
      "<!-- STACKOVERFLOW:END -->",
      stackOverflowSection
    );
  } catch (error) {
    console.error("Failed to update README:", error);
  }
}

updateReadme("jasonnathan", Bun.env.GITHUB_TOKEN);
