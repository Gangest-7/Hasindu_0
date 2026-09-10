module.exports = {
  cmd: ".sticker",
  exec: async ({ sock, msg, from }) => {
    try {
      await sock.sendMessage(from, { react: { text: "🎨", key: msg.key } });

      await sock.sendMessage(
        from,
        { text: "ℹ️ *Image එකට Reply එකක් ලෙස `.sticker` ලෙස යවන්න.*" },
        { quoted: msg }
      );

      await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
    } catch (err) {
      console.error("Sticker error:", err);
    }
  }
};
