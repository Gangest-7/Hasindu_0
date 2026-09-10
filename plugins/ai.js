const axios = require("axios");

module.exports = {
  cmd: ".ai",
  exec: async ({ sock, msg, from, query }) => {
    if (!query) {
      return await sock.sendMessage(
        from,
        { text: "❌ ප්‍රශ්නයක් යොමු කරන්න.\n\n*Example:* `.ai hi`" },
        { quoted: msg }
      );
    }

    try {
      await sock.sendMessage(from, { react: { text: "🤖", key: msg.key } });

      const res = await axios.get(`https://api.giftedtech.web.id/api/ai/gpt4?apikey=gifted&q=${encodeURIComponent(query)}`);
      const aiReply = res.data.result || "❌ පිළිතුරක් ලැබුණේ නැත.";

      await sock.sendMessage(
        from,
        { text: `🤖 *AI Response:*\n\n${aiReply}` },
        { quoted: msg }
      );

      await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      console.error("AI Error:", err);
      await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(
        from,
        { text: "❌ AI Response එක ලබාගැනීමට නොහැකි විය." },
        { quoted: msg }
      );
    }
  }
};
