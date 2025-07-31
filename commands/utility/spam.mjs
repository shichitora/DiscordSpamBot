import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import fs from 'fs/promises';

export const data = new SlashCommandBuilder()
  .setName('spam')
  .setDescription('登録したメッセージを送信します')
  .addStringOption(option =>
    option.setName('id')
      .setDescription('送信するメッセージのID')
      .setRequired(true)
  );

export async function execute(interaction) {
  const messageId = interaction.options.getString('id');

  // メッセージの読み込み
  const messages = JSON.parse(await fs.readFile('./new/messages.json', 'utf-8'));
  const userMessages = messages.users[interaction.user.id] || {};
  const content = userMessages[messageId];

  if (!content) {
    await interaction.reply({ content: `メッセージID: ${messageId} が見つかりません。`, ephemeral: true });
    return;
  }

  // 設定の読み込み
  const settings = JSON.parse(await fs.readFile('./new/settings.json', 'utf-8'));
  const userSettings = settings.users[interaction.user.id] || {
    interval: 0,
    count: 5,
    attachButton: false,
    buttonUrl: '',
    mentionUsers: []
  };

  // 非表示メッセージを送信
  await interaction.reply({ content: 'メッセージを送信中...', ephemeral: true });

  // 公開メッセージを非表示メッセージに返信
  try {
    // ランダムメンション
    let mention = '';
    if (userSettings.mentionUsers && userSettings.mentionUsers.length > 0) {
      const randomUserId = userSettings.mentionUsers[Math.floor(Math.random() * userSettings.mentionUsers.length)];
      mention = `<@${randomUserId}> `;
    }

    const sendOptions = { content: `${mention}${content}` };
    if (userSettings.attachButton) {
      const button = new ButtonBuilder()
        .setLabel('関連リンク')
        .setStyle(ButtonStyle.Link)
        .setURL(userSettings.buttonUrl || 'https://discord.gg/z23C6wHWQ');
      sendOptions.components = [new ActionRowBuilder().addComponents(button)];
    }

    for (let i = 0; i < userSettings.count; i++) {
      await interaction.followUp(sendOptions);
      if (i < userSettings.count - 1) {
        await new Promise(resolve => setTimeout(resolve, userSettings.interval * 1000));
      }
    }
  } catch (error) {
    console.error('メッセージ送信中にエラーが発生しました:', error);
    await interaction.followUp({
      content: 'エラーが発生しました。詳細はログを確認してください。',
      ephemeral: true
    });
  }
}
