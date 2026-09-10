module.exports = {
  cmd: ".ping",
  exec: async ({ sock, msg, from }) => {
    const start = Date.now();
    
    const reaction = await sock.sendMessage(from, { react: { text: "⚡", key: msg.key } });
    const end = Date.now();
    const ping = end - start;

    await sock.sendMessage(
      from,
      { text: `🚀 *Hasindu MD Speed:* \`${ping}ms\`` },
      { quoted: msg }
    );
  }
};
