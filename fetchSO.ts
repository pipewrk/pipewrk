const STACK_OVERFLOW_USER_ID = '382536';
const API_BASE = `https://api.stackexchange.com/2.3/users/${STACK_OVERFLOW_USER_ID}`;
const DEFAULT_PARAMS = `order=desc&site=stackoverflow`;

// API Endpoints
const ENDPOINTS = {
  reputation: `${API_BASE}?${DEFAULT_PARAMS}&sort=reputation`,
  answers: `${API_BASE}/answers?${DEFAULT_PARAMS}&filter=withbody&sort=activity`,
  badges: `${API_BASE}/badges?${DEFAULT_PARAMS}&sort=rank`,
  topTags: `${API_BASE}/top-tags?site=stackoverflow`,
};

/** 
 * 🏆 Reputation Data
 */
export interface ReputationResponse {
  reputation: number;
  badge_counts: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

/** 
 * 💬 StackOverflow Answer Data 
 */
export interface Answer {
  answer_id: number;
  question_id: number;
  score: number;
  is_accepted: boolean;
  link: string;
  last_activity_date: number;
  creation_date: number;
}

/** 
 * 🏅 Badge Data
 */
export interface Badge {
  name: string;
  rank: "gold" | "silver" | "bronze";
  award_count: number;
  link: string;
}

/** 
 * 🏷 Top Tags Data
 */
export interface Tag {
  tag_name: string;
  answer_count: number;
  answer_score: number;
  question_count: number;
  question_score: number;
}


/**
 * Fetch data from Stack Overflow API with retries.
 */
const fetchStackExchangeData = <T>(url: string) => async (): Promise<T | null> => {
  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json() as unknown as { items: T };
    return data.items || null;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
}

// Fetching Different StackOverflow Data
export const fetchReputation = fetchStackExchangeData<ReputationResponse[]>(ENDPOINTS.reputation);
export const fetchStackOverflowAnswers = fetchStackExchangeData<Answer[]>(ENDPOINTS.answers);
export const fetchStackOverflowBadges = fetchStackExchangeData<Badge[]>(ENDPOINTS.badges);
export const fetchTopTags = fetchStackExchangeData<Tag[]>(ENDPOINTS.topTags);

/**
 * Aggregate all SO data.
 */
export async function getStackOverflowData() {
  const [reputation, answers, badges, topTags] = await Promise.all([
    fetchReputation(),
    fetchStackOverflowAnswers(),
    fetchStackOverflowBadges(),
    fetchTopTags(),
  ]);

  return { reputation, answers, badges, topTags, impact: "~2.3m" };
}
