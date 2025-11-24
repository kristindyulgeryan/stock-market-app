import { inngest } from "./client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";
import { formatDateToday } from "../utils";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.0-flash-lite" }),

      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves";

      const {
        data: { email, name },
      } = event;
      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step 1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0) {
      return { success: false, message: "No users found for news email" };
    }

    // Step 2: For each user, get their watchlist symbols and fetch news
    const newsDataByUser = await step.run("fetch-user-news", async () => {
      const newsMap = new Map<
        string,
        { email: string; name: string; news: MarketNewsArticle[] }
      >();

      for (const user of users) {
        try {
          // Get watchlist symbols for user, fallback to general news if none
          const symbols = await getWatchlistSymbolsByEmail(user.email);

          // Fetch news (uses watchlist symbols or general market news)
          const news = await getNews(symbols.length > 0 ? symbols : undefined);

          newsMap.set(user.id, {
            email: user.email,
            name: user.name,
            news: news || [],
          });
        } catch (error) {
          console.error(`Error fetching news for user ${user.email}:`, error);
          // Fallback: empty news array
          newsMap.set(user.id, {
            email: user.email,
            name: user.name,
            news: [],
          });
        }
      }

      return newsMap;
    });

    // Step 3: Summarize news via AI (placeholder)

    const newsDataObj = newsDataByUser as Record<
      string,
      { email: string; name: string; news: MarketNewsArticle[] }
    >;

    const userNewsArray: { user: User; news: MarketNewsArticle[] }[] =
      Object.entries(newsDataObj).map(([id, payload]) => ({
        user: { id, email: payload.email, name: payload.name },
        news: payload.news || [],
      }));

    const userNewsSummeries: {
      user: User;
      newsContent: string | null;
    }[] = [];

    for (const { user, news } of userNewsArray) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsdata}}",
          JSON.stringify(news, null, 2)
        );

        const response = await step.ai.infer(`summerize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: { contents: [{ role: "user", parts: [{ text: prompt }] }] },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummeries.push({ user, newsContent });
      } catch (error) {
        console.error("Failed to Summarize news for :", user.email, error);
        userNewsSummeries.push({ user, newsContent: null });
      }
    }

    // Step 4: Send emails to users

    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummeries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: formatDateToday,
            newsContent,
          });
        })
      );
    });

    return { success: true, message: "Daily news summary processed" };
  }
);
