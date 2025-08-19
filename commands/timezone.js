const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timezone')
        .setDescription('Set or view your timezone')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Set your timezone')
                .addStringOption(option =>
                    option.setName('zone')
                        .setDescription('IANA timezone (e.g. Europe/Brussels)')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View your current timezone')),
    
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'set') {
            const zone = interaction.options.getString('zone');
            // TODO: Save to backend
            await interaction.reply(`🌍 Timezone set to: **${zone}**`);
        }
        else if (sub === 'view') {
            // TODO: Fetch from backend
            await interaction.reply(`🕒 Your timezone is: **Europe/Brussels** (placeholder)`);
        }
    },
};
