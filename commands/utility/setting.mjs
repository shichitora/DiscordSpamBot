import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import fs from 'fs/promises';

export const data = new SlashCommandBuilder()
  .setName('setting')
  .setDescription('メッセージ送信の設定を変更します');

export async function execute(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('settingModal')
    .setTitle('送信設定');

  const intervalInput = new TextInputBuilder()
    .setCustomId('interval')
    .setLabel('送信間隔 (秒, 例: 1)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const countInput = new TextInputBuilder()
    .setCustomId('count')
    .setLabel('送信メッセージ数 (2-5)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const attachButtonInput = new TextInputBuilder()
    .setCustomId('attachButton')
    .setLabel('URLボタンを付ける？ (yes/no)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const buttonUrlInput = new TextInputBuilder()
    .setCustomId('buttonUrl')
    .setLabel('ボタンのURL (付ける場合)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const mentionUsersInput = new TextInputBuilder()
    .setCustomId('mentionUsers')
    .setLabel('メンションするユーザーID (カンマ区切り)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const rows = [
    new ActionRowBuilder().addComponents(intervalInput),
    new ActionRowBuilder().addComponents(countInput),
    new ActionRowBuilder().addComponents(attachButtonInput),
    new ActionRowBuilder().addComponents(buttonUrlInput),
    new ActionRowBuilder().addComponents(mentionUsersInput)
  ];
  modal.addComponents(rows);

  await interaction.showModal(modal);

  const filter = i => i.customId === 'settingModal' && i.user.id === interaction.user.id;
  const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 300_000 }).catch(() => null);

  if (!modalSubmit) {
    await interaction.followUp({ content: 'モーダル入力がタイムアウトしました。', ephemeral: true });
    return;
  }

  const interval = parseFloat(modalSubmit.fields.getTextInputValue('interval'));
  const count = parseInt(modalSubmit.fields.getTextInputValue('count'));
  const attachButton = modalSubmit.fields.getTextInputValue('attachButton').toLowerCase() === 'yes';
  const buttonUrl = modalSubmit.fields.getTextInputValue('buttonUrl') || '';
  const mentionUsers = modalSubmit.fields.getTextInputValue('mentionUsers')
    .split(',')
    .map(id => id.trim())
    .filter(id => id.match(/^\d+$/));

  if (isNaN(interval) || interval < 0) {
    await modalSubmit.reply({ content: '送信間隔は0秒以上の数値を入力してください。', ephemeral: true });
    return;
  }
  if (isNaN(count) || count < 2 || count > 5) {
    await modalSubmit.reply({ content: 'メッセージ数は2～5の範囲で入力してください。', ephemeral: true });
    return;
  }
  if (attachButton && !buttonUrl) {
    await modalSubmit.reply({ content: 'URLボタンを付ける場合はURLを入力してください。', ephemeral: true });
    return;
  }

  const settings = JSON.parse(await fs.readFile('./new/settings.json', 'utf-8'));
  settings.users[interaction.user.id] = { interval, count, attachButton, buttonUrl, mentionUsers };
  await fs.writeFile('./new/settings.json', JSON.stringify(settings, null, 2));

  await modalSubmit.reply({ content: '設定を保存しました！', ephemeral: true });
}
