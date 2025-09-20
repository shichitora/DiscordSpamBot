import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import fs from 'fs/promises';

const predefinedMessages = {
  1: 'CUSTOM_MESSAGE_1',
  2: 'CUSTOM_MESSAGE_2',
  3: 'CUSTOM_MESSAGE_3'
};

export const data = new SlashCommandBuilder()
  .setName('template')
  .setDescription('管理者登録済みメッセージを送信します')
  .addStringOption(option =>
    option.setName('message')
      .setDescription('送信するメッセージ')
      .setRequired(true)
      .addChoices(
        { name: 'Message1', value: '1' },
        { name: 'Message2', value: '2' },
        { name: 'Message3', value: '3' }
      )
  );

export async function execute(interaction) {
  const messageKey = interaction.options.getString('message');
  const content = predefinedMessages[messageKey];

  if (!content) {
    await interaction.reply({ content: '無効なメッセージが選択されました。', ephemeral: true });
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

  await interaction.reply({ content: '公式メッセージを送信中...', ephemeral: true });

  try {
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
