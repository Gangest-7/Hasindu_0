module.exports = {
  cmd: ".alive",
  exec: async ({ sock, from, msg }) => {

    // Photo URL එක (ඔබට කැමති Image Link එකක් මෙතැනට දාන්න පුළුවන්)
    const aliveImageUrl = "https://i.ibb.co/L1Y5X1R/anime-dark.jpg"; // photo link

    const messageText = `*╭━━━〔 ⚡ HASINDU MD BOT 〕━━━╮*

  👋 *WELCOME USER!*

  👑 *Developer:* Hasindu
  🤖 *Status:* Online & Active 24/7
  ⚡ *Speed:* Super Fast
  📦 *Version:* 3.0.0 Beta

  ───────────────────
  🔥 *Click the button below to view categories!*
*╰━━━━━━━━━━━━━━━━━━━━╯*`;

    // Dropdown Button
    const buttons = [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "📌 SELECT COMMAND MENU",
          sections: [
            {
              title: "🔥 POPULAR CATEGORIES",
              rows: [
                {
                  title: "☘️ Main Menu",
                  description: "View full command list",
                  id: ".menu"
                },
                {
                  title: "🎵 Music & Songs",
                  description: "Download MP3 audio files",
                  id: ".song"
                },
                {
                  title: "🎬 Video & Downloads",
                  description: "Download videos and media",
                  id: ".download"
                },
                {
                  title: "🛠️ Tools & AI",
                  description: "Useful bot utility commands",
                  id: ".tools"
                },
                {
                  title: "🏓 Check Ping",
                  description: "Check bot speed and latency",
                  id: ".ping"
                }
              ]
            }
          ]
        })
      }
    ];

    // Image එකත් එක්කම Dropdown Menu එක යවන Structure එක
    const msgData = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "🔥 EGO MODE ACTIVATED",
              hasVideoMessage: false,
              imageMessage: (await sock.prepareMessageMedia({ image: { url: aliveImageUrl } }, "image")).imageMessage
            },
            body: { text: messageText },
            footer: { text: "POWERED BY HASINDU-MD" },
            nativeFlowMessage: {
              buttons: buttons
            }
          }
        }
      }
    };

    await sock.relayMessage(from, msgData, { messageId: msg.key.id });
  }
};
