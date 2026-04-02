import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
    // 1. Connect to the database using your environment keys
    const kv = createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });

    try {
        // 2. Pull the latest data that your bot saved under the key 'zablon_stats'
        const stats = await kv.hgetall('zablon_stats');

        // 3. If the bot hasn't sent data yet, return a default "Waiting" message
        if (!stats) {
            return response.status(200).json({
                last_block: "---",
                status: "Waiting for Bot to start...",
                total_profit: "0",
                last_update: "Never"
            });
        }

        // 4. Send the real data to your dashboard
        return response.status(200).json(stats);

    } catch (error) {
        console.error("Vercel API Error:", error);
        return response.status(500).json({ error: "Could not reach database" });
    }
}