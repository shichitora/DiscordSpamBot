import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// コマンドの定義
export const data = new SlashCommandBuilder()
    .setName('custom-send')
    .setDescription('登録せずに直接送信')
    .setDMPermission(true)
    .addIntegerOption(option =>
        option
            .setName('count')
            .setDescription('送信するメッセージの数')
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName('mode')
            .setDescription('送信モードを選択してください')
            .setRequired(true)
            .addChoices(
                { name: '通常', value: 'default' },
                { name: '順番', value: 'sequential' },
                { name: 'ランダム', value: 'random' }
            )
    )
    .addNumberOption(option =>
        option
            .setName('interval')
            .setDescription('メッセージ間の間隔（秒）')
            .setRequired(false)
            .setMinValue(0)
    )
    // メッセージ1と関連オプション（すべて任意）
    .addStringOption(option =>
        option
            .setName('message1')
            .setDescription('メッセージ1')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('embed_title_1')
            .setDescription('メッセージ1の埋め込みタイトル')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('embed_description_1')
            .setDescription('メッセージ1の埋め込み説明')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('button_label_1')
            .setDescription('メッセージ1のボタンのラベル')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('button_color_1')
            .setDescription('メッセージ1のボタンの色')
            .setRequired(false)
            .addChoices(
                { name: '青', value: 'Primary' },
                { name: '灰', value: 'Secondary' },
                { name: '緑', value: 'Success' },
                { name: '赤', value: 'Danger' }
            )
    )
    // メッセージ2と関連オプション（すべて任意）
    .addStringOption(option =>
        option
            .setName('message2')
            .setDescription('メッセージ2')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('embed_title_2')
            .setDescription('メッセージ2の埋め込みタイトル')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('embed_description_2')
            .setDescription('メッセージ2の埋め込み説明')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('button_label_2')
            .setDescription('メッセージ2のボタンのラベル')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('button_color_2')
            .setDescription('メッセージ2のボタンの色')
            .setRequired(false)
            .addChoices(
                { name: '青', value: 'Primary' },
                { name: '灰', value: 'Secondary' },
                { name: '緑', value: 'Success' },
                { name: '赤', value: 'Danger' }
            )
    )
    // メッセージ3と関連オプション（すべて任意）
    .addStringOption(option =>
        option
            .setName('message3')
            .setDescription('メッセージ3')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('embed_title_3')
            .setDescription('メッセージ3の埋め込みタイトル')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('embed_description_3')
            .setDescription('メッセージ3の埋め込み説明')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('button_label_3')
            .setDescription('メッセージ3のボタンのラベル')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('button_color_3')
            .setDescription('メッセージ3のボタンの色')
            .setRequired(false)
            .addChoices(
                { name: '青', value: 'Primary' },
                { name: '灰', value: 'Secondary' },
                { name: '緑', value: 'Success' },
                { name: '赤', value: 'Danger' }
            )
    );

// メッセージ送信ロジックを関数として抽出
const sendMessages = async (interaction, count, mode, interval, messages, embeds, buttons) => {
    try {
        let currentIndex = 0;
        for (let i = 0; i < count; i++) {
            let messageIndex;

            if (mode === 'default') {
                messageIndex = 0;
            } else if (mode === 'random') {
                messageIndex = Math.floor(Math.random() * messages.length);
            } else {
                messageIndex = currentIndex;
                currentIndex = (currentIndex + 1) % messages.length;
            }

            const messageText = messages[messageIndex];
            const embedData = embeds[messageIndex];
            const buttonData = buttons[messageIndex];

            let embed = null;
            if (embedData && (embedData.title || embedData.description)) {
                embed = new EmbedBuilder();
                if (embedData.title) embed.setTitle(embedData.title);
                if (embedData.description) embed.setDescription(embedData.description);
            }

            let row = null;
            if (buttonData && (buttonData.label || buttonData.color)) {
                const button = new ButtonBuilder()
                    .setCustomId(`button_${messageIndex}_${i}_${Date.now()}`)
                    .setLabel(buttonData.label || `ボタン${messageIndex + 1}`)
                    .setStyle(ButtonStyle[buttonData.color || 'Primary']);
                row = new ActionRowBuilder().addComponents(button);
            }

            const sendOptions = {};
            if (messageText) sendOptions.content = messageText;
            if (embed) sendOptions.embeds = [embed];
            if (row) sendOptions.components = [row];

            await interaction.followUp(sendOptions);

            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, interval * 1000));
            }
        }
    } catch (error) {
        console.error('メッセージ送信中にエラーが発生しました:', error);
        await interaction.followUp({
            content: 'エラーが発生しました。詳細はログを確認してください。',
            ephemeral: true,
        });
    }
};

// 実行関数
export const execute = async (interaction) => {

    const count = interaction.options.getInteger('count');
    const mode = interaction.options.getString('mode');
    const interval = interaction.options.getNumber('interval') ?? 0.1;

    const messages = [];
    const embeds = [];
    const buttons = [];

    for (let i = 1; i <= 3; i++) {
        const message = interaction.options.getString(`message${i}`);
        const embedTitle = interaction.options.getString(`embed_title_${i}`);
        const embedDescription = interaction.options.getString(`embed_description_${i}`);
        const buttonLabel = interaction.options.getString(`button_label_${i}`);
        const buttonColor = interaction.options.getString(`button_color_${i}`);

        if (message || embedTitle || embedDescription) {
            messages.push(message || '');
            embeds.push({
                title: embedTitle,
                description: embedDescription,
            });
            buttons.push({
                label: buttonLabel,
                color: buttonColor,
            });
        }
    }

    if (messages.length === 0) {
        await interaction.reply({
            content: '少なくとも1つのメッセージまたは埋め込みを指定してください。',
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
        content: `送信を開始します。\nDEV｜メッセージ間隔: ${interval}秒`,
        ephemeral: true,
    });

    // 初回のメッセージ送信
    await sendMessages(interaction, count, mode, interval, messages, embeds, buttons);
};
