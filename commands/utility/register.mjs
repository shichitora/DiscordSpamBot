import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import fs from 'fs/promises';

export const data = new SlashCommandBuilder()
  .setName('register')
  .setDescription('カスタムメッセージを登録します');

export async function execute(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('registerModal')
    .setTitle('カスタムメッセージ登録');

  const idInput = new TextInputBuilder()
    .setCustomId('messageId')
    .setLabel('メッセージID')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const contentInput = new TextInputBuilder()
    .setCustomId('messageContent')
    .setLabel('メッセージ内容 (改行可)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const idRow = new ActionRowBuilder().addComponents(idInput);
  const contentRow = new ActionRowBuilder().addComponents(contentInput);
  modal.addComponents(idRow, contentRow);

  await interaction.showModal(modal);

  const filter = i => i.customId === 'registerModal' && i.user.id === interaction.user.id;
  const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 300_000 }).catch(() => null);

  if (!modalSubmit) {
    await interaction.followUp({ content: 'モーダル入力がタイムアウトしました。', ephemeral: true });
    return;
  }

  const messageId = modalSubmit.fields.getTextInputValue('messageId');
  const content = modalSubmit.fields.getTextInputValue('messageContent');

  // JSONに保存
  const messages = JSON.parse(await fs.readFile('./new/messages.json', 'utf-8'));
  if (!messages.users[interaction.user.id]) {
    messages.users[interaction.user.id] = {};
  }
  messages.users[interaction.user.id][messageId] = content;
  await fs.writeFile('./new/messages.json', JSON.stringify(messages, null, 2));

  await modalSubmit.reply({ content: `メッセージID: ${messageId} を登録しました！`, ephemeral: true });
}
